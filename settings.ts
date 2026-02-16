import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export const settings = definePluginSettings({
    enableMultiAccount: {
        type: OptionType.BOOLEAN,
        description: "Enable multi-account mode",
        default: false,
        restartNeeded: true,
    },
    showAccountSwitcher: {
        type: OptionType.BOOLEAN,
        description: "Show account switcher in user panel",
        default: true,
        restartNeeded: false,
    },
    mergeDMs: {
        type: OptionType.BOOLEAN,
        description: "Merge DMs from all accounts",
        default: true,
        restartNeeded: false,
    },
    mergeServers: {
        type: OptionType.BOOLEAN,
        description: "Merge servers from all accounts",
        default: true,
        restartNeeded: false,
    },
    showFakeItems: {
        type: OptionType.BOOLEAN,
        description: "Show fake DM and server items in UI",
        default: true,
        restartNeeded: false,
    },
    fakeItemsCount: {
        type: OptionType.SLIDER,
        description: "Number of fake items to show per account",
        default: 3,
        markers: [1, 2, 3, 4, 5],
        stickToMarkers: true,
        restartNeeded: false,
    }
});
