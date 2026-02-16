//// Plugin originally written for Equicord at 2026-02-16 by https://github.com/Bluscream, https://antigravity.google
// region Imports
import definePlugin from "@utils/types";
import { Devs } from "@utils/constants";
import {
    React,
    UserStore,
    GuildStore,
    showToast,
    Toasts,
    Button,
    Text,
    Switch,
    TextInput,
    useState,
    useEffect
} from "@webpack/common";
import {
    ModalRoot,
    ModalHeader,
    ModalContent,
    ModalFooter,
    ModalCloseButton,
    openModal,
    ModalProps,
    ModalSize
} from "@utils/modal";
import { Logger } from "@utils/Logger";

import { settings } from "./settings";
// endregion Imports

// region PluginInfo
export const pluginInfo = {
    id: "multiAccount",
    name: "MultiAccount",
    description: "Allows using multiple Discord accounts in one instance by merging DMs and servers",
    color: "#7289da",
    authors: [
        Devs.D3SOX,
        { name: "Bluscream", id: 467777925790564352n },
        { name: "Assistant", id: 0n }
    ],
};
// endregion PluginInfo

// region Variables
const logger = new Logger(pluginInfo.id, pluginInfo.color);
let multiAccountData: AccountData[] = [];
let isMultiAccountMode = false;

interface AccountData {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    token: string;
    isActive: boolean;
}
// endregion Variables

// region Components
function AccountManagementModal({ modalProps }: { modalProps: ModalProps }) {
    const [accounts, setAccounts] = useState<AccountData[]>(multiAccountData);
    const [newAccountToken, setNewAccountToken] = useState("");

    const addAccount = async () => {
        if (!newAccountToken.trim()) {
            showToast("Please enter a token", Toasts.Type.FAILURE);
            return;
        }

        try {
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

function AccountSwitcher() {
    const [currentAccount, setCurrentAccount] = useState<string>("");

    useEffect(() => {
        const currentUser = UserStore.getCurrentUser();
        if (currentUser) {
            setCurrentAccount(`${currentUser.username}${currentUser.discriminator !== "0" ? `#${currentUser.discriminator}` : ""}`);
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
// endregion Components

// region Definition
export default definePlugin({
    name: pluginInfo.name,
    description: pluginInfo.description,
    authors: pluginInfo.authors,
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

    getMultiAccountUser() {
        if (!isMultiAccountMode) return null;
        return multiAccountData.find(acc => acc.isActive) || null;
    },

    patchGuildList(originalGuilds: any[]) {
        if (!isMultiAccountMode || !settings.store.mergeServers || !settings.store.showFakeItems) return originalGuilds;

        const fakeGuilds: any[] = [];
        multiAccountData.forEach(account => {
            if (account.isActive) {
                fakeGuilds.push({
                    id: `fake-guild-${account.id}`,
                    name: `${account.username}'s Servers`,
                    icon: account.avatar || null,
                    fake: true,
                    accountId: account.id,
                    type: 'fake-account-header'
                });

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

    patchDMList(originalDMs: any[]) {
        if (!isMultiAccountMode || !settings.store.mergeDMs || !settings.store.showFakeItems) return originalDMs;

        const fakeDMs: any[] = [];
        multiAccountData.forEach(account => {
            if (account.isActive) {
                fakeDMs.push({
                    id: `fake-dm-${account.id}`,
                    name: `${account.username}'s DMs`,
                    type: 1,
                    fake: true,
                    accountId: account.id,
                    recipients: [{
                        id: account.id,
                        username: account.username,
                        discriminator: account.discriminator,
                        avatar: account.avatar
                    }]
                });

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

    getMultiAccountStores() {
        return [];
    },

    start() {
        isMultiAccountMode = settings.store.enableMultiAccount;
        logger.info("Plugin started");
    },

    stop() {
        logger.info("Plugin stopped");
    },

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
// endregion Definition
