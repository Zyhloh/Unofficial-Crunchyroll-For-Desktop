using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using Microsoft.Web.WebView2.Core;
using System.Windows.Forms;
using Microsoft.Win32;
using DiscordRPC;
using DiscordRPC.Logging;

namespace CrunchyrollForDesktop;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class MainWindow : Window
{
    private WindowState _previousWindowState;
    private WindowStyle _previousWindowStyle;
    private ResizeMode _previousResizeMode;
    private Rect _previousBounds;
    private bool _hardwareAccelerationEnabled = true;
    private const string REGISTRY_KEY = @"SOFTWARE\CrunchyrollForDesktop";
    private const string HARDWARE_ACCEL_VALUE = "HardwareAcceleration";
    
    // Discord RPC
    private DiscordRpcClient? _discordClient;
    private const string DISCORD_APP_ID = "1412040406597636146";

    public MainWindow()
    {
        InitializeComponent();
        LoadSettings();
        InitializeDiscordRPC();
        // Auto-update temporarily disabled for installer compatibility
        Loaded += MainWindow_Loaded;
        StateChanged += MainWindow_StateChanged;
        Closing += MainWindow_Closing;
    }

    private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        try
        {
            var userData = System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "CrunchyrollForDesktop", "UserData");
            System.IO.Directory.CreateDirectory(userData);

            var options = new CoreWebView2EnvironmentOptions
            {
                AdditionalBrowserArguments = GetBrowserArguments()
            };
            var env = await CoreWebView2Environment.CreateAsync(userDataFolder: userData, options: options);
            await Web.EnsureCoreWebView2Async(env);

            SetupWebView2();
            UpdateToggleAppearance(); // Set initial appearance based on loaded setting
            UpdateDiscordPresence("Browsing Crunchyroll", "Just started watching");

            // Handle fullscreen requests from web content (like video players)
            Web.CoreWebView2.ContainsFullScreenElementChanged += (s2, args) =>
            {
                Dispatcher.Invoke(() =>
                {
                    if (Web.CoreWebView2.ContainsFullScreenElement)
                    {
                        // Save current window state before going fullscreen
                        _previousWindowState = this.WindowState;
                        _previousWindowStyle = this.WindowStyle;
                        _previousResizeMode = this.ResizeMode;
                        _previousBounds = new Rect(this.Left, this.Top, this.Width, this.Height);

                        // Enter true system fullscreen (covers taskbar)
                        this.WindowStyle = WindowStyle.None;
                        this.WindowState = WindowState.Normal; // Reset to normal first
                        this.ResizeMode = ResizeMode.NoResize;
                        
                        // Cover entire screen including taskbar
                        var screen = System.Windows.Forms.Screen.FromHandle(new System.Windows.Interop.WindowInteropHelper(this).Handle);
                        this.Left = screen.Bounds.Left;
                        this.Top = screen.Bounds.Top;
                        this.Width = screen.Bounds.Width;
                        this.Height = screen.Bounds.Height;
                        
                        // Hide title bar completely
                        TitleBarRow.Height = new GridLength(0);
                        this.Padding = new Thickness(0);
                        if (TitleBarContainer != null)
                            TitleBarContainer.Visibility = Visibility.Collapsed;
                            
                        // Bring to front
                        this.Topmost = true;
                    }
                    else
                    {
                        // Exit fullscreen: restore everything
                        this.Topmost = false;
                        this.WindowStyle = _previousWindowStyle;
                        this.ResizeMode = _previousResizeMode;
                        
                        // Restore window bounds
                        this.Left = _previousBounds.Left;
                        this.Top = _previousBounds.Top;
                        this.Width = _previousBounds.Width;
                        this.Height = _previousBounds.Height;
                        this.WindowState = _previousWindowState;
                        
                        // Restore title bar
                        TitleBarRow.Height = new GridLength(42);
                        if (TitleBarContainer != null)
                            TitleBarContainer.Visibility = Visibility.Visible;
                        
                        // Force restore windowed layout instead of maximized layout
                        RestoreWindowedLayout();
                    }
                });
            };

            // Navigate to Crunchyroll
            Web.Source = new Uri("https://www.crunchyroll.com/");
        }
        catch (Exception ex)
        {
            System.Windows.MessageBox.Show($"Failed to initialize WebView2: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private void SetupWebView2()
    {
        // Basic settings
        Web.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
        Web.CoreWebView2.Settings.AreDevToolsEnabled = false;
        Web.CoreWebView2.Settings.IsStatusBarEnabled = false;
        Web.CoreWebView2.Settings.IsZoomControlEnabled = true;

        // Handle new windows/popups inside same view
        Web.CoreWebView2.NewWindowRequested += (s2, args) =>
        {
            args.Handled = true;
            if (!string.IsNullOrEmpty(args.Uri))
            {
                Web.CoreWebView2.Navigate(args.Uri);
            }
        };

        // Monitor navigation and redirect non-Crunchyroll URLs
        Web.CoreWebView2.NavigationStarting += (s2, args) =>
        {
            var uri = new Uri(args.Uri);
            var host = uri.Host.ToLower();
            
            // Allow Crunchyroll domains and auth/CDN domains
            var allowedDomains = new[]
            {
                "crunchyroll.com",
                "www.crunchyroll.com", 
                "beta.crunchyroll.com",
                "store.crunchyroll.com",
                "accounts.google.com",
                "ssl.gstatic.com",
                "fonts.googleapis.com",
                "fonts.gstatic.com"
            };
            
            bool isAllowed = allowedDomains.Any(domain => host == domain || host.EndsWith("." + domain));
            
            if (!isAllowed)
            {
                args.Cancel = true;
                Web.CoreWebView2.Navigate("https://www.crunchyroll.com/");
            }
        };
        
        // Track page navigation for Discord RPC
        Web.CoreWebView2.NavigationCompleted += (s2, args) =>
        {
            if (args.IsSuccess)
            {
                var url = Web.CoreWebView2.Source;
                UpdateDiscordPresenceFromUrl(url);
            }
        };
    }

    private string GetBrowserArguments()
    {
        return _hardwareAccelerationEnabled ? 
            "" : // Hardware acceleration enabled (default)
            "--disable-gpu --disable-accelerated-2d-canvas --disable-accelerated-video-decode";
    }

    private void ReloadWebView()
    {
        // Show a message that restart is required for hardware acceleration changes
        var result = System.Windows.MessageBox.Show(
            "Hardware acceleration changes require restarting the app. Restart now?",
            "Hardware Acceleration",
            MessageBoxButton.YesNo,
            MessageBoxImage.Question);
            
        if (result == MessageBoxResult.Yes)
        {
            // Restart the application
            System.Diagnostics.Process.Start(Environment.ProcessPath ?? "CrunchyrollForDesktop.exe");
            System.Windows.Application.Current.Shutdown();
        }
        else
        {
            // Revert the toggle state
            _hardwareAccelerationEnabled = !_hardwareAccelerationEnabled;
            UpdateToggleAppearance();
        }
    }
    
    private void UpdateToggleAppearance()
    {
        if (HardwareAccelToggle != null)
        {
            HardwareAccelToggle.Foreground = _hardwareAccelerationEnabled ? 
                new SolidColorBrush(Color.FromRgb(76, 175, 80)) : // Green when ON
                new SolidColorBrush(Color.FromRgb(244, 67, 54));   // Red when OFF
            HardwareAccelToggle.ToolTip = $"Hardware Acceleration: {(_hardwareAccelerationEnabled ? "ON" : "OFF")}";
        }
    }

    private void MinButton_Click(object sender, RoutedEventArgs e)
    {
        WindowState = WindowState.Minimized;
    }


    private void MaxButton_Click(object sender, RoutedEventArgs e)
    {
        WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;
    }

    private void HardwareAccelToggle_Click(object sender, RoutedEventArgs e)
    {
        _hardwareAccelerationEnabled = !_hardwareAccelerationEnabled;
        SaveSettings();
        UpdateToggleAppearance();
        ReloadWebView();
    }

    private void CloseButton_Click(object sender, RoutedEventArgs e)
    {
        Close();
    }

    private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ButtonState == MouseButtonState.Pressed)
        {
            if (e.ClickCount == 2)
            {
                // Double-click to maximize/restore
                WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;
            }
            else
            {
                if (WindowState == WindowState.Maximized)
                {
                    // Store mouse position before changing window state
                    var mousePos = PointToScreen(e.GetPosition(this));
                    var titleBarClickX = e.GetPosition(this).X;
                    
                    // Calculate proportional position - clamp to reasonable range
                    var windowWidthRatio = Math.Max(0.1, Math.Min(0.9, titleBarClickX / this.ActualWidth));
                    var restoredWidth = 1400;
                    var restoredHeight = 900;
                    
                    // Position window so click point maintains relative position
                    var newLeft = mousePos.X - (restoredWidth * windowWidthRatio);
                    var newTop = mousePos.Y - 21;
                    
                    // Screen bounds checking
                    var screen = System.Windows.Forms.Screen.FromPoint(new System.Drawing.Point((int)mousePos.X, (int)mousePos.Y));
                    newLeft = Math.Max(0, Math.Min(newLeft, screen.WorkingArea.Width - restoredWidth));
                    newTop = Math.Max(0, Math.Min(newTop, screen.WorkingArea.Height - restoredHeight));
                    
                    // Restore window state and position
                    WindowState = WindowState.Normal;
                    Left = newLeft;
                    Top = newTop;
                    
                    // Use Dispatcher to ensure layout is updated before dragging
                    Dispatcher.BeginInvoke(new Action(() =>
                    {
                        try { DragMove(); } catch { /* ignore */ }
                    }), System.Windows.Threading.DispatcherPriority.Input);
                }
                else
                {
                    try { DragMove(); } catch { /* ignore */ }
                }
            }
        }
    }

    private void MainWindow_StateChanged(object? sender, EventArgs e)
    {
        ApplyMaximizedLayout();
    }

    private void ApplyMaximizedLayout()
    {
        if (WindowState == WindowState.Maximized)
        {
            // Remove rounded corners when maximized
            if (FindName("MainBorder") is Border mainBorder)
                mainBorder.CornerRadius = new CornerRadius(0);
            if (TitleBarContainer != null)
                TitleBarContainer.CornerRadius = new CornerRadius(0);
            
            // Adjust positioning for maximized state
            if (FindName("WindowButtonsPanel") is StackPanel buttonsPanel)
                buttonsPanel.Margin = new Thickness(0, 5, 8, 0); // Half of previous adjustment
            if (FindName("TitleText") is TextBlock titleText && titleText.Parent is StackPanel titlePanel)
                titlePanel.Margin = new Thickness(16, 5, 0, 0);
            if (FindName("HardwareAccelToggle") is System.Windows.Controls.Button toggleButton)
            {
                toggleButton.Margin = new Thickness(2, 5, 7, 5); // Align vertically with other buttons
                // Reduce button size by 15% in maximized mode
                toggleButton.Width = 24; // 85% of 28
                toggleButton.Height = 24;
                toggleButton.FontSize = 18; // 85% of 21
            }
            // Also reduce size of other window control buttons in maximized mode
            if (FindName("MinButton") is System.Windows.Controls.Button minBtn)
            {
                minBtn.Width = 24;
                minBtn.Height = 24;
            }
            if (FindName("MaxButton") is System.Windows.Controls.Button maxBtn)
            {
                maxBtn.Width = 24;
                maxBtn.Height = 24;
            }
            if (FindName("CloseButton") is System.Windows.Controls.Button closeBtn)
            {
                closeBtn.Width = 24;
                closeBtn.Height = 24;
            }
        }
        else
        {
            // Restore rounded corners when not maximized
            if (FindName("MainBorder") is Border mainBorder)
                mainBorder.CornerRadius = new CornerRadius(12);
            if (TitleBarContainer != null)
                TitleBarContainer.CornerRadius = new CornerRadius(12, 12, 0, 0);
            
            // Restore normal positioning for windowed state
            if (FindName("WindowButtonsPanel") is StackPanel buttonsPanel)
                buttonsPanel.Margin = new Thickness(0, 0, 8, 0);
            if (FindName("TitleText") is TextBlock titleText && titleText.Parent is StackPanel titlePanel)
                titlePanel.Margin = new Thickness(16, 0, 0, 0);
            if (FindName("HardwareAccelToggle") is System.Windows.Controls.Button toggleButton)
            {
                toggleButton.Margin = new Thickness(2, 0, 8, 0); // Align with other buttons (0 top/bottom margin)
                // Restore normal button size
                toggleButton.Width = 28;
                toggleButton.Height = 28;
                toggleButton.FontSize = 21;
            }
            // Restore normal size for other window control buttons
            if (FindName("MinButton") is System.Windows.Controls.Button minBtn)
            {
                minBtn.Width = 28;
                minBtn.Height = 28;
            }
            if (FindName("MaxButton") is System.Windows.Controls.Button maxBtn)
            {
                maxBtn.Width = 28;
                maxBtn.Height = 28;
            }
            if (FindName("CloseButton") is System.Windows.Controls.Button closeBtn)
            {
                closeBtn.Width = 28;
                closeBtn.Height = 28;
            }
        }
    }
    
    private void RestoreWindowedLayout()
    {
        // Restore rounded corners
        if (FindName("MainBorder") is Border mainBorder)
            mainBorder.CornerRadius = new CornerRadius(12);
        if (TitleBarContainer != null)
            TitleBarContainer.CornerRadius = new CornerRadius(12, 12, 0, 0);
        
        // Clear any explicit sizing and margins to let XAML defaults take over
        if (FindName("WindowButtonsPanel") is StackPanel buttonsPanel)
        {
            buttonsPanel.ClearValue(StackPanel.MarginProperty);
        }
        if (FindName("TitleText") is TextBlock titleText && titleText.Parent is StackPanel titlePanel)
        {
            titlePanel.ClearValue(StackPanel.MarginProperty);
        }
        if (FindName("HardwareAccelToggle") is System.Windows.Controls.Button toggleButton)
        {
            toggleButton.ClearValue(System.Windows.Controls.Button.MarginProperty);
            toggleButton.ClearValue(System.Windows.Controls.Button.WidthProperty);
            toggleButton.ClearValue(System.Windows.Controls.Button.HeightProperty);
            toggleButton.FontSize = 21; // Keep large icon
        }
        // Clear explicit sizing for other window control buttons
        if (FindName("MinButton") is System.Windows.Controls.Button minBtn)
        {
            minBtn.ClearValue(System.Windows.Controls.Button.WidthProperty);
            minBtn.ClearValue(System.Windows.Controls.Button.HeightProperty);
        }
        if (FindName("MaxButton") is System.Windows.Controls.Button maxBtn)
        {
            maxBtn.ClearValue(System.Windows.Controls.Button.WidthProperty);
            maxBtn.ClearValue(System.Windows.Controls.Button.HeightProperty);
        }
        if (FindName("CloseButton") is System.Windows.Controls.Button closeBtn)
        {
            closeBtn.ClearValue(System.Windows.Controls.Button.WidthProperty);
            closeBtn.ClearValue(System.Windows.Controls.Button.HeightProperty);
        }
    }
    
    private void InitializeDiscordRPC()
    {
        try
        {
            _discordClient = new DiscordRpcClient(DISCORD_APP_ID);
            _discordClient.Logger = new ConsoleLogger() { Level = LogLevel.Warning };
            
            _discordClient.OnReady += (sender, e) =>
            {
                Console.WriteLine($"Discord RPC connected to {e.User.Username}");
                Console.WriteLine("Setting initial Discord presence...");
            };
            
            _discordClient.OnError += (sender, e) =>
            {
                Console.WriteLine($"Discord RPC error: {e.Message}");
            };
            
            _discordClient.Initialize();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to initialize Discord RPC: {ex.Message}");
        }
    }
    
    private void UpdateDiscordPresence(string details, string state)
    {
        try
        {
            if (_discordClient?.IsInitialized == true)
            {
                _discordClient.SetPresence(new RichPresence()
                {
                    Details = "Made With ❤️ By Zyhloh",
                    State = "github.com/zyhloh",
                    Assets = new Assets()
                    {
                        LargeImageKey = "crunchyroll_logo",
                        LargeImageText = "Crunchyroll For Desktop",
                        SmallImageKey = "smallcrunchyroll_logo",
                        SmallImageText = "Crunchyroll For Desktop"
                    },
                    Buttons = new DiscordRPC.Button[]
                    {
                        new DiscordRPC.Button()
                        {
                            Label = "Download",
                            Url = "https://github.com/zyhloh/unofficial-crunchyroll-for-desktop"
                        }
                    },
                    Timestamps = new Timestamps()
                    {
                        Start = DateTime.UtcNow
                    }
                });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to update Discord presence: {ex.Message}");
        }
    }
    
    private void UpdateDiscordPresenceFromUrl(string url)
    {
        try
        {
            var uri = new Uri(url);
            var path = uri.AbsolutePath.ToLower();
            
            if (path.Contains("/watch/"))
            {
                // Extract anime title from URL if possible
                var segments = path.Split('/');
                var animeTitle = "Unknown Anime";
                
                if (segments.Length > 2)
                {
                    animeTitle = segments[2].Replace("-", " ").Replace("_", " ");
                    animeTitle = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(animeTitle);
                }
                
                UpdateDiscordPresence($"Watching {animeTitle}", "Enjoying anime content");
            }
            else if (path.Contains("/series/"))
            {
                UpdateDiscordPresence("Browsing anime series", "Looking for something to watch");
            }
            else if (path.Contains("/simulcasts"))
            {
                UpdateDiscordPresence("Checking simulcasts", "Finding new episodes");
            }
            else if (path.Contains("/watchlist"))
            {
                UpdateDiscordPresence("Managing watchlist", "Organizing anime to watch");
            }
            else
            {
                UpdateDiscordPresence("Browsing Crunchyroll", "Exploring anime content");
            }
        }
        catch
        {
            UpdateDiscordPresence("Using Crunchyroll", "Watching anime");
        }
    }
    
    private void MainWindow_Closing(object? sender, System.ComponentModel.CancelEventArgs e)
    {
        try
        {
            _discordClient?.Dispose();
        }
        catch { }
    }
    
    // Auto-update functionality temporarily removed for .NET 8 compatibility
    // Will be re-implemented with a modern update solution in future version
    
    private void LoadSettings()
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(REGISTRY_KEY);
            if (key != null)
            {
                var value = key.GetValue(HARDWARE_ACCEL_VALUE);
                if (value != null && bool.TryParse(value.ToString(), out bool enabled))
                {
                    _hardwareAccelerationEnabled = enabled;
                }
            }
        }
        catch
        {
            // If registry read fails, use default (true)
            _hardwareAccelerationEnabled = true;
        }
    }
    
    private void SaveSettings()
    {
        try
        {
            using var key = Registry.CurrentUser.CreateSubKey(REGISTRY_KEY);
            key?.SetValue(HARDWARE_ACCEL_VALUE, _hardwareAccelerationEnabled);
        }
        catch
        {
            // Ignore registry write failures
        }
    }
}