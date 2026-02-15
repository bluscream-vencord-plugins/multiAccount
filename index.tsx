/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import {
    React,
    UserStore,
    GuildStore,
    ChannelStore,
    SelectedGuildStore,
    SelectedChannelStore,
    showToast,
    Toasts,
    Button,
    Text,
    Switch,
    TextInput,
    useState,
    useEffect
} from "@webpack/common";
import { ModalRoot, ModalHeader, ModalContent, ModalFooter, ModalCloseButton, openModal, ModalProps, ModalSize } from "@utils/modal";
// Form components will be imported from webpack/common

// Account management interface
interface AccountData {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    token: string;
    isActive: boolean;
}

// Global state for multiple accounts
let multiAccountData: AccountData[] = [];
let isMultiAccountMode = false;

// Settings
const settings = definePluginSettings({
    enableMultiAccount: {
        type: OptionType.BOOLEAN,
        description: "Enable multi-account mode",
        default: false
    },
    showAccountSwitcher: {
        type: OptionType.BOOLEAN,
        description: "Show account switcher in user panel",
        default: true
    },
    mergeDMs: {
        type: OptionType.BOOLEAN,
        description: "Merge DMs from all accounts",
        default: true
    },
    mergeServers: {
        type: OptionType.BOOLEAN,
        description: "Merge servers from all accounts",
        default: true
    },
    showFakeItems: {
        type: OptionType.BOOLEAN,
        description: "Show fake DM and server items in UI",
        default: true
    },
    fakeItemsCount: {
        type: OptionType.SLIDER,
        description: "Number of fake items to show per account",
        default: 3,
        markers: [1, 2, 3, 4, 5],
        stickToMarkers: true
    }
});

// Account Management Modal
function AccountManagementModal({ modalProps }: { modalProps: ModalProps }) {
    const [accounts, setAccounts] = useState<AccountData[]>(multiAccountData);
    const [newAccountToken, setNewAccountToken] = useState("");

    const addAccount = async () => {
        if (!newAccountToken.trim()) {
            showToast("Please enter a token", Toasts.Type.FAILURE);
            return;
        }

        try {
            // This is a simplified example - in reality, you'd need to validate the token
            // and fetch user data from Discord's API
            const newAccount: AccountData = {
                id: Date.now().toString(),
                username: "Loading...",
                discriminator: "0000",
                avatar: "",
                token: newAccountToken,
                isActive: false
            };

            setAccounts([...accounts, newAccount]);
            setNewAccountToken("");
            showToast("Account added (token validation needed)", Toasts.Type.SUCCESS);
        } catch (error) {
            showToast("Failed to add account", Toasts.Type.FAILURE);
        }
    };

    const removeAccount = (accountId: string) => {
        setAccounts(accounts.filter(acc => acc.id !== accountId));
        showToast("Account removed", Toasts.Type.SUCCESS);
    };

    const toggleAccount = (accountId: string) => {
        setAccounts(accounts.map(acc =>
            acc.id === accountId ? { ...acc, isActive: !acc.isActive } : acc
        ));
    };

    return (
        <ModalRoot {...modalProps} size={ModalSize.LARGE}>
            <ModalHeader>
                <Text variant="heading-lg/semibold">Multi-Account Management</Text>
                <ModalCloseButton onClick={modalProps.onClose} />
            </ModalHeader>
            <ModalContent>
                <div style={{ marginBottom: '20px' }}>
                    <Text variant="heading-md/semibold" style={{ marginBottom: '10px' }}>Add New Account</Text>
                    <TextInput
                        placeholder="Enter Discord token..."
                        value={newAccountToken}
                        onChange={setNewAccountToken}
                    />
                    <Button onClick={addAccount} color={Button.Colors.BRAND} style={{ marginTop: '10px' }}>
                        Add Account
                    </Button>
                </div>

                <div style={{ borderTop: '1px solid var(--background-modifier-accent)', margin: '20px 0' }} />

                <div>
                    <Text variant="heading-md/semibold" style={{ marginBottom: '10px' }}>Active Accounts</Text>
                    {accounts.map(account => (
                        <div key={account.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <Switch
                                value={account.isActive}
                                onChange={() => toggleAccount(account.id)}
                            />
                            <Text variant="text-md/normal">
                                {account.username}#{account.discriminator}
                            </Text>
                            <Button
                                onClick={() => removeAccount(account.id)}
                                color={Button.Colors.RED}
                                size={Button.Sizes.SMALL}
                            >
                                Remove
                            </Button>
                        </div>
                    ))}
                </div>
            </ModalContent>
            <ModalFooter>
                <Button onClick={modalProps.onClose}>
                    Close
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}

// Account Switcher Component
function AccountSwitcher() {
    const [currentAccount, setCurrentAccount] = useState<string>("");

    useEffect(() => {
        // Get current account info
        const currentUser = UserStore.getCurrentUser();
        if (currentUser) {
            setCurrentAccount(`${currentUser.username}#${currentUser.discriminator}`);
        }
    }, []);

    const openAccountManager = () => {
        openModal(modalProps => <AccountManagementModal modalProps={modalProps} />);
    };

    if (!settings.store.showAccountSwitcher || !isMultiAccountMode) return null;

    return (
        <div style={{ padding: '10px', borderBottom: '1px solid var(--background-modifier-accent)' }}>
            <Text variant="text-sm/bold">Current Account: {currentAccount}</Text>
            <Button onClick={openAccountManager} size={Button.Sizes.SMALL}>
                Manage Accounts
            </Button>
        </div>
    );
}

import { Logger } from "@utils/Logger";

const pluginId = "multiAccount";
const pluginName = "Multi Account";
const logger = new Logger(pluginName, "#7289da");

// Main plugin component
export default definePlugin({
    name: pluginName,
    description: "Allows using multiple Discord accounts in one instance by merging DMs and servers",
    authors: [Devs.D3SOX, { name: "Bluscream", id: 467777925790564352n }],

    settings,

    patches: [
        {
            find: "getCurrentUser",
            replacement: {
                match: /getCurrentUser\(\)/,
                replace: "getCurrentUser() || $self.getMultiAccountUser()"
            }
        },
        {
            find: ".Guilds",
            replacement: {
                match: /(\w+)\.map\(/,
                replace: "$self.patchGuildList($1).map("
            }
        },
        {
            find: ".DirectMessages",
            replacement: {
                match: /(\w+)\.map\(/,
                replace: "$self.patchDMList($1).map("
            }
        },
        {
            find: "useStateFromStores",
            replacement: {
                match: /useStateFromStores\(\[(\w+)\]/,
                replace: "useStateFromStores([$1, $self.getMultiAccountStores()]"
            }
        }
    ],

    // Multi-account data getters
    getMultiAccountUser() {
        if (!isMultiAccountMode) return null;
        // Return merged user data from all active accounts
        return multiAccountData.find(acc => acc.isActive) || null;
    },

    // Patch guild list to include fake guilds from other accounts
    patchGuildList(originalGuilds: any[]) {
        if (!isMultiAccountMode || !settings.store.mergeServers || !settings.store.showFakeItems) return originalGuilds;

        const fakeGuilds: any[] = [];
        multiAccountData.forEach(account => {
            if (account.isActive) {
                // Create fake guild items for this account
                fakeGuilds.push({
                    id: `fake-guild-${account.id}`,
                    name: `${account.username}'s Servers`,
                    icon: account.avatar || null,
                    fake: true,
                    accountId: account.id,
                    type: 'fake-account-header'
                });

                // Add fake servers for this account based on settings
                const itemCount = settings.store.fakeItemsCount || 3;
                for (let i = 0; i < itemCount; i++) {
                    fakeGuilds.push({
                        id: `fake-server-${account.id}-${i}`,
                        name: `Server ${i + 1} (${account.username})`,
                        icon: null,
                        fake: true,
                        accountId: account.id,
                        type: 'fake-server'
                    });
                }
            }
        });

        return [...originalGuilds, ...fakeGuilds];
    },

    // Patch DM list to include fake DMs from other accounts
    patchDMList(originalDMs: any[]) {
        if (!isMultiAccountMode || !settings.store.mergeDMs || !settings.store.showFakeItems) return originalDMs;

        const fakeDMs: any[] = [];
        multiAccountData.forEach(account => {
            if (account.isActive) {
                // Create fake DM items for this account
                fakeDMs.push({
                    id: `fake-dm-${account.id}`,
                    name: `${account.username}'s DMs`,
                    type: 1, // DM type
                    fake: true,
                    accountId: account.id,
                    recipients: [{
                        id: account.id,
                        username: account.username,
                        discriminator: account.discriminator,
                        avatar: account.avatar
                    }]
                });

                // Add fake DM channels for this account based on settings
                const itemCount = settings.store.fakeItemsCount || 3;
                for (let i = 0; i < itemCount; i++) {
                    fakeDMs.push({
                        id: `fake-dm-channel-${account.id}-${i}`,
                        name: `DM ${i + 1} (${account.username})`,
                        type: 1,
                        fake: true,
                        accountId: account.id,
                        recipients: [{
                            id: `fake-user-${account.id}-${i}`,
                            username: `User${i + 1}`,
                            discriminator: '0000',
                            avatar: null
                        }]
                    });
                }
            }
        });

        return [...originalDMs, ...fakeDMs];
    },

    // Get additional stores for multi-account mode
    getMultiAccountStores() {
        if (!isMultiAccountMode) return [];
        // Return additional stores that need to be monitored
        return [];
    },

    getMultiAccountGuilds() {
        if (!isMultiAccountMode || !settings.store.mergeServers) return null;
        // Return merged guild data from all active accounts
        const allGuilds: any[] = [];
        multiAccountData.forEach(account => {
            if (account.isActive) {
                // In a real implementation, you'd fetch guilds for each account
                // This is a simplified example
                const guilds = GuildStore.getGuilds();
                if (guilds) {
                    Object.values(guilds).forEach(guild => allGuilds.push(guild));
                }
            }
        });
        return allGuilds;
    },

    getMultiAccountChannels() {
        if (!isMultiAccountMode || !settings.store.mergeDMs) return null;
        // Return merged channel data from all active accounts
        const allChannels: any[] = [];
        multiAccountData.forEach(account => {
            if (account.isActive) {
                // In a real implementation, you'd fetch channels for each account
                // This is a simplified example
                // In a real implementation, you'd fetch channels for each account
                // This is a simplified example - ChannelStore doesn't have getChannels method
                const channels = {};
                if (channels) {
                    Object.values(channels).forEach(channel => allChannels.push(channel));
                }
            }
        });
        return allChannels;
    },

    // Settings panel component
    SettingsPanel: () => {
        const [isEnabled, setIsEnabled] = useState(settings.store.enableMultiAccount);

        const toggleMultiAccount = () => {
            const newValue = !isEnabled;
            setIsEnabled(newValue);
            settings.store.enableMultiAccount = newValue;
            isMultiAccountMode = newValue;

            if (newValue) {
                showToast("Multi-account mode enabled", Toasts.Type.SUCCESS);
            } else {
                showToast("Multi-account mode disabled", Toasts.Type.SUCCESS);
            }
        };

        return (
            <div>
                <Text variant="heading-md/semibold" style={{ marginBottom: '20px' }}>Multi-Account Settings</Text>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <Switch
                        value={isEnabled}
                        onChange={toggleMultiAccount}
                    />
                    <Text variant="text-md/normal">Enable Multi-Account Mode</Text>
                </div>

                {isEnabled && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <Switch
                                value={settings.store.showAccountSwitcher}
                                onChange={(value) => settings.store.showAccountSwitcher = value}
                            />
                            <Text variant="text-md/normal">Show Account Switcher</Text>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <Switch
                                value={settings.store.mergeDMs}
                                onChange={(value) => settings.store.mergeDMs = value}
                            />
                            <Text variant="text-md/normal">Merge DMs</Text>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <Switch
                                value={settings.store.mergeServers}
                                onChange={(value) => settings.store.mergeServers = value}
                            />
                            <Text variant="text-md/normal">Merge Servers</Text>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <Switch
                                value={settings.store.showFakeItems}
                                onChange={(value) => settings.store.showFakeItems = value}
                            />
                            <Text variant="text-md/normal">Show Fake Items in UI</Text>
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                            <Text variant="text-sm/normal" style={{ marginBottom: '5px' }}>
                                Fake Items Count: {settings.store.fakeItemsCount}
                            </Text>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={settings.store.fakeItemsCount}
                                onChange={(e) => settings.store.fakeItemsCount = parseInt(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <Button onClick={() => openModal(modalProps => <AccountManagementModal modalProps={modalProps} />)}>
                            Manage Accounts
                        </Button>
                    </>
                )}
            </div>
        );
    }
});
