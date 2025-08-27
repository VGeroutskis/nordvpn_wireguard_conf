# NordVPN Wireguard Configuration

A web-based application for browsing and connecting to NordVPN servers with an intuitive interface and WireGuard configuration generation.

## Features

- **Server Discovery**: Browse thousands of NordVPN servers worldwide
- **Advanced Filtering**: Filter servers by country, city, load, and online status
- **Detailed Server Information**: View comprehensive server details including:
  - Server specifications and supported technologies
  - IP addresses and connection protocols
  - Geographic location and network load
- **VPN Credentials**: Authenticate with your NordVPN access token to retrieve connection credentials
- **WireGuard Config Generation**: Download ready-to-use WireGuard configuration files
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop and mobile devices
- **Local Storage**: Remembers your settings and connection history

## Live

Visit the live application: [https://vgeroutskis.github.io/nordvpn_wireguard_conf](https://vgeroutskis.github.io/nordvpn_wireguard_conf)

## Screenshots

### Server Browser
The main interface shows servers in a clean, paginated grid with sorting by server load.

### Server Details Modal
Click any server to view detailed information including supported protocols, IP addresses, and connection options.

### Dark Mode
Toggle between light and dark themes using the switch in the header.

## How to Use

1. **Browse Servers**: The application loads NordVPN servers automatically
2. **Filter Results**: Use the country and city dropdowns to narrow down servers
3. **View Details**: Click on any server tile to see detailed information
4. **Connect**: 
   - Enter your NordVPN access token in the modal
   - Click "Connect" to authenticate and retrieve credentials
   - Download the WireGuard configuration file
5. **Import Config**: Use the downloaded `.conf` file with any WireGuard client

## Getting Your NordVPN Access Token

1. Log in to your NordVPN account at [nordvpn.com](https://nordvpn.com)
2. Go to your account dashboard
3. Navigate to "Services" → "NordVPN" → "Manual Setup"
4. Copy your access token

**Note**: Keep your access token secure and never share it publicly.

## Technical Details

### Architecture
- **Frontend**: Pure HTML5, CSS3, and vanilla JavaScript
- **API Integration**: NordVPN public API via CORS proxies
- **Authentication**: HTTP Basic Auth with NordVPN access tokens
- **Storage**: Browser localStorage for user preferences and connection history

### CORS Proxy Usage
Due to browser CORS restrictions, the application uses public CORS proxies to access the NordVPN API. In production environments, consider implementing a backend proxy for better reliability and security.

### Supported Protocols
The application retrieves credentials for:
- **WireGuard/NordLynx**: Modern, fast VPN protocol
- **OpenVPN**: Traditional VPN protocol (TCP/UDP)
- **IKEv2/IPSec**: Built-in protocol support

## Installation & Development

### Running Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/VGeroutskis/nordvpn_wireguard_conf.git
   cd nordvpn_wireguard_conf
   ```

2. Serve the files using any web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Or simply open index.html in your browser
   ```

3. Open your browser to `http://localhost:8000`

### Project Structure
```
nordvpn-server-browser/
├── index.html          # Main application interface
├── NonrdVPN.js         # Core application logic
├── README.md           # This file
└── assets/             # Images and additional resources
```

### Deployment to GitHub Pages
1. Create a new GitHub repository
2. Upload all files to the repository
3. Go to repository Settings → Pages
4. Select "Deploy from a branch" → "main" → "/ (root)"
5. Your site will be available at `https://vgeroutskis.github.io/nordvpn_wireguard_conf`

## Browser Support

- **Chrome/Chromium**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

Modern browsers with ES6+ support are required.

## Security Considerations

- Access tokens are stored in browser localStorage
- All API communications use HTTPS
- No server-side data storage or logging
- CORS proxy services are third-party (consider security implications)

## Limitations

- **CORS Proxies**: Relies on third-party proxies which may have rate limits or downtime
- **Client-Side Only**: Cannot perform server-side operations
- **Public Proxies**: May not work reliably in all regions or networks

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -am 'Add new feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is for educational and personal use. Please respect NordVPN's Terms of Service when using their API.

## Disclaimer

This application is not affiliated with or endorsed by NordVPN. Use at your own risk and ensure compliance with NordVPN's Terms of Service.

## Troubleshooting

### Common Issues

**"CORS error" or "Network request failed"**
- Try refreshing the page
- Check your internet connection
- The CORS proxy service may be temporarily unavailable

**"Invalid access token"**
- Verify your token is correct and hasn't expired
- Ensure your NordVPN subscription is active
- Try generating a new token from your NordVPN account

**"No servers found"**
- Clear your browser cache and reload
- Try different filter combinations
- Check the browser console for error messages

### Getting Help

- Check the browser console (F12) for error messages
- Ensure JavaScript is enabled in your browser
- Try using a different browser or incognito/private mode

## Changelog

### Version 1.0.0
- Initial release with core functionality
- Server browsing and filtering
- VPN credential retrieval
- WireGuard configuration generation
- Dark mode theme
- Local storage for user preferences
