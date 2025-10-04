# Vencord Multi-Account Plugin

A Vencord plugin that allows using multiple Discord accounts in one instance by merging DMs and servers in the UI.

## ⚠️ Important Disclaimer

**This plugin is experimental and may cause issues with Discord's Terms of Service. Use at your own risk.**

## Features

- **Multi-Account Support**: Use multiple Discord accounts simultaneously
- **Merged DMs**: View and manage DMs from all accounts in one interface
- **Merged Servers**: Access servers from all accounts without switching
- **Account Switcher**: Easy switching between active accounts
- **Account Management**: Add, remove, and manage multiple accounts
- **Configurable**: Toggle features on/off as needed
- **Fake Items**: Show fake DM and server items in UI for demonstration
- **Token Management**: Securely store and manage multiple Discord tokens

## Settings

- **Enable Multi-Account Mode**: Master toggle for the plugin
- **Show Account Switcher**: Display account switcher in user panel
- **Merge DMs**: Combine DMs from all accounts
- **Merge Servers**: Combine servers from all accounts
- **Show Fake Items**: Show fake DM and server items in UI for demonstration
- **Fake Items Count**: Number of fake items to show per account (1-5)

## How It Works

1. **Enable the plugin** in Vencord settings
2. **Add accounts** using Discord tokens (requires manual token extraction)
3. **Configure settings** for DM and server merging
4. **Switch between accounts** using the account switcher
5. **View merged content** from all active accounts

## Installation

1. Copy the `blu-multiacc` folder to your Vencord `src/userplugins` directory
2. Rebuild Vencord: `npm run build`
3. Restart Discord
4. Enable the plugin in Vencord settings
5. Configure your accounts in the plugin settings

## Account Setup

### Getting Discord Tokens

⚠️ **Warning**: Extracting Discord tokens is against Discord's Terms of Service and may result in account termination.

To get tokens (for educational purposes only):

1. Open Discord in your browser
2. Open Developer Tools (F12)
3. Go to Network tab
4. Look for requests to `discord.com/api`
5. Find the `authorization` header value

### Adding Accounts

1. Open plugin settings
2. Click "Manage Accounts"
3. Enter your Discord token
4. The plugin will attempt to validate and add the account

## Technical Details

### Architecture

- **Account Management**: Stores account data locally
- **UI Merging**: Patches Discord's store functions to return merged data
- **Token Handling**: Securely stores and manages multiple tokens
- **State Management**: Tracks active accounts and their data
- **Fake Items**: Creates demonstration items for UI testing

### Limitations

- **Token Security**: Tokens are stored locally (consider security implications)
- **API Rate Limits**: Multiple accounts may hit rate limits faster
- **Discord TOS**: May violate Discord's Terms of Service
- **Experimental**: Plugin is in early development stage
- **Fake Data**: Uses demonstration data rather than real account data

## Security Considerations

- **Token Storage**: Tokens are stored in plain text locally
- **Account Safety**: Using multiple accounts may trigger Discord's security systems
- **Data Privacy**: All account data is processed locally

## Troubleshooting

### Common Issues

1. **Plugin not loading**: Ensure Vencord is properly installed
2. **Accounts not merging**: Check that accounts are marked as active
3. **Token errors**: Verify tokens are valid and not expired
4. **UI not updating**: Try reloading Discord

### Getting Help

- Check the GitHub issues page
- Ensure you're using the latest version
- Verify Vencord compatibility

## Development

This plugin is experimental and under active development. Features may change or break.

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Legal Notice

This plugin is for educational purposes only. Users are responsible for compliance with Discord's Terms of Service. The developers are not responsible for any account actions taken by Discord.

## AI Disclaimer

This plugin was developed with the assistance of AI (Claude Sonnet 4). The AI helped with code structure, implementation details, and debugging. While the code has been reviewed and tested, please use it at your own discretion. If you encounter any issues, please report them through the GitHub issues page.
