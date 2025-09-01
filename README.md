# 🍥 Crunchyroll For Desktop

An unofficial desktop application for Crunchyroll with Discord Rich Presence integration and hardware-accelerated video playback.

![Crunchyroll For Desktop](https://img.shields.io/badge/Platform-Windows-blue?style=for-the-badge)
![.NET](https://img.shields.io/badge/.NET-8.0-purple?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## ✨ Features

- **Native Crunchyroll Experience** - Direct embedding of Crunchyroll web interface
- **Discord Rich Presence** - Show what you're watching on Discord
- **Hardware Acceleration** - Smooth video playback with GPU acceleration
- **DRM Support** - Full Widevine DRM support for premium content
- **Optimized for Streaming** - 1400x900 window optimized for anime viewing
- **Secure** - Permissive CSP for Crunchyroll while blocking other external sites

## 🚀 Quick Start

### Option 1: Download Pre-built Installer (Recommended)
1. Go to [Releases](https://github.com/zyhloh/unofficial-crunchyroll-for-desktop/releases)
2. Download `CrunchyrollForDesktopSetup-v1.0.0.exe`
3. Run the installer
4. Launch from Start Menu or Desktop shortcut

> **Note:** The packaged installer includes WebView2 runtime, so no additional dependencies are required.

### Option 2: Build from Source

#### Prerequisites
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Microsoft Edge WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (if not already installed)
- Windows 10/11

#### Build Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/zyhloh/unofficial-crunchyroll-for-desktop.git
   cd unofficial-crunchyroll-for-desktop
   ```

2. Navigate to the project directory:
   ```bash
   cd CrunchyrollForDesktop
   ```

3. Build the application:
   ```bash
   dotnet build .\CrunchyrollForDesktop.csproj -c Release
   ```

4. Run the application:
   ```bash
   dotnet run --project CrunchyrollForDesktop.csproj
   ```

## 📦 Creating Your Own Installer

If you want to package the application into an installer:

### Using Inno Setup (Recommended)
1. Install [Inno Setup 6](https://jrsoftware.org/isinfo.php)
2. Create an Inno Setup script (`.iss` file) pointing to your build output
3. Compile using Inno Setup Compiler

### Alternative Packaging Options
- **NSIS** - Nullsoft Scriptable Install System
- **WiX Toolset** - Windows Installer XML
- **Advanced Installer** - Commercial solution with GUI

## 🛠️ Development

### Project Structure
```
CrunchyrollForDesktop/
├── App.xaml                 # Application definition
├── App.xaml.cs              # Application code-behind
├── MainWindow.xaml          # Main window UI
├── MainWindow.xaml.cs       # Main window logic
├── CrunchyrollForDesktop.csproj  # Project file
├── images/                  # Application icons
└── font/                    # Custom fonts
```

### Key Dependencies
- **Microsoft.Web.WebView2** - Web browser control
- **DiscordRPC** - Discord Rich Presence integration
- **Microsoft.WindowsAPICodePack-Shell** - Windows shell integration

### Building for Distribution
```bash
# Build self-contained executable
dotnet publish .\CrunchyrollForDesktop.csproj -c Release -r win-x64 --self-contained true
```

## 🔧 Configuration

The application stores settings in the Windows Registry under:
```
HKEY_CURRENT_USER\SOFTWARE\CrunchyrollForDesktop
```

### Settings Include:
- Hardware acceleration preferences
- Window state and position
- Discord RPC integration settings

## 🎮 Discord Integration

The app automatically shows your Crunchyroll activity on Discord:
- Currently watching anime title
- Episode information
- Viewing status (watching, paused, browsing)

## 🔒 Security & Privacy

- **Domain Allowlist** - Only allows Crunchyroll, Google auth, and CDN domains
- **Content Security Policy** - Blocks unauthorized external content
- **Local Storage** - Settings stored locally on your machine
- **No Data Collection** - Application doesn't collect or transmit user data

## 🐛 Troubleshooting

### Common Issues

**WebView2 Not Found:**
- Download and install [Microsoft Edge WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
- Or use the packaged installer which includes WebView2

**Build Errors:**
- Ensure .NET 8.0 SDK is installed
- Restore NuGet packages: `dotnet restore`
- Clean and rebuild: `dotnet clean && dotnet build`

**Discord RPC Not Working:**
- Ensure Discord is running
- Check Discord settings allow Rich Presence
- Restart the application

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This is an unofficial application and is not affiliated with, endorsed by, or sponsored by Crunchyroll, LLC or Sony Pictures Entertainment. Crunchyroll is a trademark of Crunchyroll, LLC.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/zyhloh/unofficial-crunchyroll-for-desktop/issues)
- **Discussions:** [GitHub Discussions](https://github.com/zyhloh/unofficial-crunchyroll-for-desktop/discussions)

---

Made with ❤️ by [Zyhloh](https://github.com/zyhloh)
