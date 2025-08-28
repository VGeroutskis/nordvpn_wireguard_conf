let allServers = [];
let filteredServers = [];
let currentPage = 1;
const serversPerPage = 6;

const fetchNordVPN = async () => {
  const targetUrl = 'https://api.nordvpn.com/v1/servers?limit=20000';

  const proxies = [
    {
      name: 'ThingProxy',
      url: 'https://thingproxy.freeboard.io/fetch/',
      format: 'direct'
    },
    {
      name: 'CORS-Anywhere',
      url: 'https://cors-anywhere.herokuapp.com/',
      format: 'direct'
    },
    {
      name: 'Proxy6',
      url: 'https://api.codetabs.com/v1/proxy?quest=',
      format: 'direct'
    }
  ];

  for (let proxy of proxies) {
    try {
      // console.log(`Trying ${proxy.name}...`);

      const proxyUrl = proxy.url + (proxy.name === 'Proxy6' ? encodeURIComponent(targetUrl) : targetUrl);

      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      // console.log(`Success with ${proxy.name}:`, data);

      allServers = data;
      filteredServers = data;
      currentPage = 1;

      hideLoading();
      populateFilters(data);
      displayServers();
      setupPagination();

      return data;

    } catch (error) {
      // console.log(`${proxy.name} failed:`, error.message);
      continue;
    }
  }

  console.error('All proxies failed!');
  hideLoading();
  showError();
  return null;
};

const hideLoading = () => {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
};

const showError = () => {
  const container = document.getElementById('servers-container');
  container.innerHTML = '<div class="loading">Failed to load servers. Please try again later.</div>';
};

const populateFilters = (servers) => {
  const countries = new Set();
  const cities = new Set();

  servers.forEach(server => {
    const countryName = server.locations?.[0]?.country?.name;
    const cityName = server.locations?.[0]?.country?.city?.name;

    if (countryName) countries.add(countryName);
    if (cityName) cities.add(cityName);
  });

  const countrySelect = document.getElementById('country-filter');
  Array.from(countries).sort().forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    countrySelect.appendChild(option);
  });

  const citySelect = document.getElementById('city-filter');
  Array.from(cities).sort().forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    option.textContent = city;
    citySelect.appendChild(option);
  });

  countrySelect.addEventListener('change', applyFilters);
  citySelect.addEventListener('change', applyFilters);
};

const applyFilters = () => {
  const selectedCountry = document.getElementById('country-filter').value;
  const selectedCity = document.getElementById('city-filter').value;

  filteredServers = allServers.filter(server => {
    const countryName = server.locations?.[0]?.country?.name || '';
    const cityName = server.locations?.[0]?.country?.city?.name || '';

    const matchesCountry = !selectedCountry || countryName === selectedCountry;
    const matchesCity = !selectedCity || cityName === selectedCity;

    return matchesCountry && matchesCity;
  });

  currentPage = 1; // Reset to first page when filtering
  displayServers();
  setupPagination();
  updateCityOptions(selectedCountry);
};

const updateCityOptions = (selectedCountry) => {
  const citySelect = document.getElementById('city-filter');
  const currentCityValue = citySelect.value;

  citySelect.innerHTML = '<option value="">All Cities</option>';

  const cities = new Set();
  const serversToCheck = selectedCountry
    ? allServers.filter(server => server.locations?.[0]?.country?.name === selectedCountry)
    : allServers;

  serversToCheck.forEach(server => {
    const cityName = server.locations?.[0]?.country?.city?.name;
    if (cityName) cities.add(cityName);
  });

  Array.from(cities).sort().forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    option.textContent = city;
    citySelect.appendChild(option);
  });

  if (currentCityValue && cities.has(currentCityValue)) {
    citySelect.value = currentCityValue;
  }
};

const displayServers = () => {
  const container = document.getElementById('servers-container');

  if (!filteredServers || filteredServers.length === 0) {
    container.innerHTML = '<div class="loading">No servers found with current filters.</div>';
    document.getElementById('pagination').style.display = 'none';
    updateResultsCount(0);
    return;
  }

  // Sort servers by load (χαμηλότερο load πρώτα)
  const sortedServers = [...filteredServers].sort((a, b) => {
    if (a.status === 'online' && b.status !== 'online') return -1;
    if (b.status === 'online' && a.status !== 'online') return 1;

    const loadA = parseInt(a.load) || 999;
    const loadB = parseInt(b.load) || 999;
    return loadA - loadB;
  });

  // Calculate pagination
  const startIndex = (currentPage - 1) * serversPerPage;
  const endIndex = startIndex + serversPerPage;
  const serversToShow = sortedServers.slice(startIndex, endIndex);

  container.innerHTML = '';

  serversToShow.forEach(server => {
    const tile = createServerTile(server);
    container.appendChild(tile);
  });

  updateResultsCount(sortedServers.length);
  document.getElementById('pagination').style.display = 'flex';
};

const updateResultsCount = (count) => {
  const countElement = document.getElementById('results-count');
  const totalPages = Math.ceil(count / serversPerPage);
  const startResult = count > 0 ? (currentPage - 1) * serversPerPage + 1 : 0;
  const endResult = Math.min(currentPage * serversPerPage, count);

  countElement.textContent = `Showing ${startResult}-${endResult} of ${count} servers (Page ${currentPage} of ${totalPages})`;
};

const setupPagination = () => {
  const totalPages = Math.ceil(filteredServers.length / serversPerPage);

  // Update page info
  document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;

  // Update button states
  document.getElementById('first-btn').disabled = currentPage === 1;
  document.getElementById('prev-btn').disabled = currentPage === 1;
  document.getElementById('next-btn').disabled = currentPage === totalPages;
  document.getElementById('last-btn').disabled = currentPage === totalPages;

  // Setup event listeners (only once)
  if (!window.paginationSetup) {
    document.getElementById('first-btn').addEventListener('click', () => goToPage(1));
    document.getElementById('prev-btn').addEventListener('click', () => goToPage(currentPage - 1));
    document.getElementById('next-btn').addEventListener('click', () => goToPage(currentPage + 1));
    document.getElementById('last-btn').addEventListener('click', () => {
      const totalPages = Math.ceil(filteredServers.length / serversPerPage);
      goToPage(totalPages);
    });
    window.paginationSetup = true;
  }
};

const goToPage = (page) => {
  const totalPages = Math.ceil(filteredServers.length / serversPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    displayServers();
    setupPagination();

    // Scroll to top of results
    document.getElementById('servers-container').scrollIntoView({ behavior: 'smooth' });
  }
};

const createServerTile = (server) => {
  const tile = document.createElement('div');
  tile.className = 'server-tile';

  const statusClass = server.status === 'online' ? 'online' : 'offline';

  tile.innerHTML = `
    <div class="server-name">${server.name || 'Unknown Server'}</div>
    <div class="server-info"><strong>Country:</strong> ${server.locations?.[0]?.country?.name || 'Unknown'}</div>
    <div class="server-info"><strong>City:</strong> ${server.locations?.[0]?.country?.city?.name || 'Unknown'}</div>
    <div class="server-info"><strong>Load:</strong> ${server.load || 'Unknown'}%</div>
    <div class="server-info"><strong>Status:</strong> <span class="server-status ${statusClass}">${server.status || 'Unknown'}</span></div>
    <div class="server-info"><strong>Hostname:</strong> ${server.hostname || 'Unknown'}</div>
  `;

  // Add click event listener
  tile.addEventListener('click', () => {
    openServerModal(server);
  });

  return tile;
};

const openServerModal = (server) => {
  selectedServer = server;
  const modal = document.getElementById('serverModal');
  const modalServerName = document.getElementById('modal-server-name');
  const modalServerInfo = document.getElementById('modal-server-info');

  // Update modal content with detailed information
  modalServerName.textContent = server.name || 'Unknown Server';

  // Build detailed server information
  let detailsHTML = '';

  // Basic Information
  detailsHTML += `
    <div class="detail-section">
      <h4>Basic Information</h4>
      <div class="detail-item"><span class="detail-label">Server ID:</span> ${server.id || 'N/A'}</div>
      <div class="detail-item"><span class="detail-label">Hostname:</span> ${server.hostname || 'N/A'}</div>
      <div class="detail-item"><span class="detail-label">Station IP:</span> <span class="ip-address">${server.station || 'N/A'}</span></div>
      <div class="detail-item"><span class="detail-label">Status:</span> <span class="status-${server.status}">${server.status || 'Unknown'}</span></div>
      <div class="detail-item"><span class="detail-label">Load:</span> ${server.load || 'Unknown'}%</div>
      <div class="detail-item"><span class="detail-label">Created:</span> ${server.created_at || 'N/A'}</div>
      <div class="detail-item"><span class="detail-label">Updated:</span> ${server.updated_at || 'N/A'}</div>
    </div>
  `;

  // Location Information
  if (server.locations && server.locations.length > 0) {
    const location = server.locations[0];
    detailsHTML += `
      <div class="detail-section">
        <h4>Location</h4>
        <div class="detail-item"><span class="detail-label">Country:</span> ${location.country?.name || 'N/A'} (${location.country?.code || 'N/A'})</div>
        <div class="detail-item"><span class="detail-label">City:</span> ${location.country?.city?.name || 'N/A'}</div>
        <div class="detail-item"><span class="detail-label">DNS Name:</span> ${location.country?.city?.dns_name || 'N/A'}</div>
        <div class="detail-item"><span class="detail-label">Coordinates:</span> ${location.latitude || 'N/A'}, ${location.longitude || 'N/A'}</div>
        <div class="detail-item"><span class="detail-label">Hub Score:</span> ${location.country?.city?.hub_score || 'N/A'}</div>
      </div>
    `;
  }

  // IP Addresses
  if (server.ips && server.ips.length > 0) {
    detailsHTML += `
      <div class="detail-section">
        <h4>IP Addresses</h4>
    `;
    server.ips.forEach(ipInfo => {
      detailsHTML += `
        <div class="detail-item">
          <span class="detail-label">IP:</span> <span class="ip-address">${ipInfo.ip?.ip || 'N/A'}</span>
          <span class="detail-label">Version:</span> IPv${ipInfo.ip?.version || 'N/A'}
          <span class="detail-label">Type:</span> ${ipInfo.type || 'N/A'}
        </div>
      `;
    });
    detailsHTML += `</div>`;
  }

  // IPv6 Station
  if (server.ipv6_station) {
    detailsHTML += `
      <div class="detail-section">
        <h4>IPv6 Information</h4>
        <div class="detail-item"><span class="detail-label">IPv6 Station:</span> <span class="ip-address">${server.ipv6_station}</span></div>
      </div>
    `;
  }

  // Technologies
  if (server.technologies && server.technologies.length > 0) {
    detailsHTML += `
      <div class="detail-section">
        <h4>Supported Technologies</h4>
        <div style="margin-top: 8px;">
    `;
    server.technologies.forEach(tech => {
      const techStatus = tech.pivot?.status || 'unknown';
      detailsHTML += `
        <span class="technology-item status-${techStatus}">
          ${tech.name || tech.identifier || 'Unknown'} (${techStatus})
        </span>
      `;
    });
    detailsHTML += `</div></div>`;
  }

  // Services
  if (server.services && server.services.length > 0) {
    detailsHTML += `
      <div class="detail-section">
        <h4>Services</h4>
        <div style="margin-top: 8px;">
    `;
    server.services.forEach(service => {
      detailsHTML += `<span class="technology-item">${service.name || service.identifier || 'Unknown'}</span>`;
    });
    detailsHTML += `</div></div>`;
  }

  // Groups
  if (server.groups && server.groups.length > 0) {
    detailsHTML += `
      <div class="detail-section">
        <h4>Server Groups</h4>
        <div style="margin-top: 8px;">
    `;
    server.groups.forEach(group => {
      detailsHTML += `
        <span class="group-item">
          ${group.title || 'Unknown'} (${group.type?.title || 'Unknown Type'})
        </span>
      `;
    });
    detailsHTML += `</div></div>`;
  }

  // Specifications
  if (server.specifications && server.specifications.length > 0) {
    detailsHTML += `
      <div class="detail-section">
        <h4>Specifications</h4>
    `;
    server.specifications.forEach(spec => {
      detailsHTML += `
        <div class="detail-item">
          <span class="detail-label">${spec.title || spec.identifier || 'Unknown'}:</span>
      `;
      if (spec.values && spec.values.length > 0) {
        spec.values.forEach(value => {
          detailsHTML += ` ${value.value || 'N/A'}`;
        });
      }
      detailsHTML += `</div>`;
    });
    detailsHTML += `</div>`;
  }

  // Technology Metadata (like Wireguard public keys)
  const techsWithMetadata = server.technologies?.filter(tech => tech.metadata && tech.metadata.length > 0) || [];
  if (techsWithMetadata.length > 0) {
    detailsHTML += `
      <div class="detail-section">
        <h4>Technology Details</h4>
    `;
    techsWithMetadata.forEach(tech => {
      detailsHTML += `<div class="detail-item"><span class="detail-label">${tech.name}:</span></div>`;
      tech.metadata.forEach(meta => {
        detailsHTML += `<div class="detail-item" style="margin-left: 15px;"><span class="detail-label">${meta.name}:</span> <span class="ip-address">${meta.value}</span></div>`;
      });
    });
    detailsHTML += `</div>`;
  }

  modalServerInfo.innerHTML = detailsHTML;

  // Check if access token exists and update UI accordingly
  setupModalForConnection();

  // Show modal
  modal.style.display = 'block';

  // Focus on appropriate field
  setTimeout(() => {
    const tokenInput = document.getElementById('access-token');
    if (tokenInput.style.display !== 'none') {
      tokenInput.focus();
    }
  }, 300);
};

const setupModalForConnection = () => {
  const storedToken = localStorage.getItem('nordvpn_access_token');
  const connectedServerId = localStorage.getItem('nordvpn_connected_server_id');
  const tokenInput = document.getElementById('access-token');
  const tokenLabel = document.querySelector('label[for="access-token"]');
  const connectBtn = document.getElementById('connect-btn');
  const clearTokenBtn = document.getElementById('clear-token-btn');
  const downloadBtn = document.getElementById('download-config-btn');
  const errorMessage = document.getElementById('token-error');
  const successMessage = document.getElementById('success-message');

  // Reset messages
  errorMessage.style.display = 'none';
  successMessage.style.display = 'none';

  if (storedToken) {
    tokenInput.value = '•'.repeat(Math.min(storedToken.length, 20));
    tokenInput.disabled = true;
    tokenInput.type = 'text';
    tokenLabel.textContent = 'Stored Access Token:';
    clearTokenBtn.style.display = 'inline-block';

    // Show download button if connected to any server
    if (connectedServerId) {
      downloadBtn.style.display = 'inline-block';
    } else {
      downloadBtn.style.display = 'none';
    }

    // Check if already connected to this server
    if (connectedServerId && connectedServerId === selectedServer.id.toString()) {
      connectBtn.textContent = 'Disconnect';
      connectBtn.className = 'btn btn-secondary';

      const serverName = localStorage.getItem('nordvpn_connected_server_name') || selectedServer.name;
      const connectedAt = localStorage.getItem('nordvpn_connected_at');
      const connectionTime = connectedAt ? new Date(connectedAt).toLocaleString() : 'Unknown';

      successMessage.innerHTML = `
        <strong>Currently connected to ${serverName}</strong><br>
        <small>Connected since: ${connectionTime}</small><br>
        <small>Click "Download Config" to get WireGuard configuration file</small>
      `;
      successMessage.style.display = 'block';
    } else {
      connectBtn.textContent = 'Connect';
      connectBtn.className = 'btn btn-primary';

      if (connectedServerId) {
        const otherServerName = localStorage.getItem('nordvpn_connected_server_name') || `Server #${connectedServerId}`;
        successMessage.innerHTML = `
          Currently connected to <strong>${otherServerName}</strong><br>
          <small>Click Connect to switch to ${selectedServer.name}</small>
        `;
        successMessage.style.display = 'block';
      }
    }
  } else {
    tokenInput.value = '';
    tokenInput.disabled = false;
    tokenInput.type = 'password';
    tokenLabel.textContent = 'Access Token:';
    clearTokenBtn.style.display = 'none';
    downloadBtn.style.display = 'none';
    connectBtn.textContent = 'Connect';
    connectBtn.className = 'btn btn-primary';
  }
};

const getServerNameById = (serverId) => {
  const server = allServers.find(s => s.id.toString() === serverId);
  return server ? server.name : null;
};

const closeModal = () => {
  document.getElementById('serverModal').style.display = 'none';
  selectedServer = null;
};

const validateAndConnect = async () => {
  const storedToken = localStorage.getItem('nordvpn_access_token');
  const connectedServer = localStorage.getItem('nordvpn_connected_server');
  const connectBtn = document.getElementById('connect-btn');

  // Check if this is a disconnect action
  if (storedToken && connectedServer === selectedServer.id.toString()) {
    handleDisconnect();
    return;
  }

  // Handle connection
  if (storedToken) {
    // Use stored token
    await handleConnection(storedToken);
  } else {
    // Validate and store new token
    const accessToken = document.getElementById('access-token').value.trim();
    const errorMessage = document.getElementById('token-error');

    errorMessage.style.display = 'none';

    if (!accessToken) {
      errorMessage.textContent = 'Please enter an access token';
      errorMessage.style.display = 'block';
      return;
    }

    if (accessToken.length < 10) {
      errorMessage.textContent = 'Access token seems too short';
      errorMessage.style.display = 'block';
      return;
    }

    // Store token and connect
    localStorage.setItem('nordvpn_access_token', accessToken);
    await handleConnection(accessToken);
  }
};

const handleConnection = async (token) => {
  const connectBtn = document.getElementById('connect-btn');
  const successMessage = document.getElementById('success-message');
  const errorMessage = document.getElementById('token-error');
  const originalText = connectBtn.textContent;

  connectBtn.textContent = 'Connecting...';
  connectBtn.disabled = true;

  try {
    // Make API call to get user credentials
    // console.log('Fetching user credentials...');

    const credentials = await fetchUserCredentials(token);

    if (!credentials) {
      throw new Error('Failed to fetch credentials');
    }

    // Store all connection data in separate localStorage fields
    localStorage.setItem('nordvpn_access_token', token);
    localStorage.setItem('nordvpn_connected_server_id', selectedServer.id.toString());
    localStorage.setItem('nordvpn_connected_server_name', selectedServer.name || 'Unknown Server');
    localStorage.setItem('nordvpn_connected_server_ip', selectedServer.station || 'N/A');
    localStorage.setItem('nordvpn_connected_server_load', selectedServer.load ? selectedServer.load.toString() : '0');

    // Store credentials separately
    localStorage.setItem('nordvpn_credentials_id', credentials.id ? credentials.id.toString() : 'N/A');
    localStorage.setItem('nordvpn_credentials_username', credentials.username || 'N/A');
    localStorage.setItem('nordvpn_credentials_password', credentials.password || 'N/A');
    localStorage.setItem('nordvpn_credentials_nordlynx_key', credentials.nordlynx_private_key || 'N/A');
    localStorage.setItem('nordvpn_credentials_created_at', credentials.created_at || 'N/A');
    localStorage.setItem('nordvpn_credentials_updated_at', credentials.updated_at || 'N/A');

    // Store connection timestamp
    localStorage.setItem('nordvpn_connected_at', new Date().toISOString());

    // Store if this is simulated or real
    localStorage.setItem('nordvpn_connection_simulated', credentials.note && credentials.note.includes('Simulated') ? 'true' : 'false');

    // console.log('Successfully connected to server:', selectedServer);
    // console.log('User credentials retrieved:', credentials);

    // Update UI to show connected state
    connectBtn.textContent = 'Disconnect';
    connectBtn.className = 'btn btn-secondary';
    connectBtn.disabled = false;

    // Create detailed success message with all credentials
    const isSimulated = credentials.note && credentials.note.includes('Simulated');

    successMessage.innerHTML = `
      <div style="margin-bottom: 10px;">
        <strong>Successfully connected to ${selectedServer.name}!</strong>
        ${isSimulated ? '<br><small style="color: #e67e22;">⚠️ Demo Mode: Simulated credentials due to browser limitations</small>' : ''}
      </div>
      <div style="font-size: 12px; background: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 8px;">
        <div style="margin-bottom: 8px;"><strong>VPN Credentials:</strong></div>
        <div style="margin-bottom: 3px;"><strong>Credentials ID:</strong> <code>${credentials.id || 'N/A'}</code></div>
        <div style="margin-bottom: 3px;"><strong>Username:</strong> <code>${credentials.username || 'N/A'}</code></div>
        <div style="margin-bottom: 3px;"><strong>Password:</strong> <code>${credentials.password || 'N/A'}</code></div>
        ${credentials.nordlynx_private_key && credentials.nordlynx_private_key !== 'N/A' ?
        `<div style="margin-bottom: 3px;"><strong>NordLynx Private Key:</strong> <code style="word-break: break-all;">${credentials.nordlynx_private_key}</code></div>`
        : ''
      }
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #dee2e6;">
          <div style="margin-bottom: 3px;"><strong>Server IP:</strong> <code>${selectedServer.station || 'N/A'}</code></div>
          <div style="margin-bottom: 3px;"><strong>Server Load:</strong> ${selectedServer.load || 'Unknown'}%</div>
          <div style="margin-bottom: 3px;"><strong>Connected At:</strong> ${new Date().toLocaleString()}</div>
        </div>
        ${credentials.created_at ?
        `<div style="margin-top: 8px; color: #6c757d; font-size: 10px;">
            <div><strong>Credentials Created:</strong> ${credentials.created_at}</div>
            <div><strong>Credentials Updated:</strong> ${credentials.updated_at || 'N/A'}</div>
          </div>`
        : ''
      }
        ${isSimulated ?
        '<div style="margin-top: 8px; color: #e67e22; font-size: 10px;"><strong>Note:</strong> In production, use a backend server to avoid CORS issues</div>'
        : ''
      }
      </div>
    `;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';

    // Update the input to show masked token
    const tokenInput = document.getElementById('access-token');
    tokenInput.value = '•'.repeat(Math.min(token.length, 20));
    tokenInput.disabled = true;
    tokenInput.type = 'text';

    document.querySelector('label[for="access-token"]').textContent = 'Stored Access Token:';
    document.getElementById('clear-token-btn').style.display = 'inline-block';

  } catch (error) {
    console.error('Connection failed:', error);

    // Show error and reset UI
    connectBtn.textContent = originalText;
    connectBtn.disabled = false;

    let errorMsg = 'Connection failed. ';
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      errorMsg += 'Invalid access token.';
      // Clear invalid token and all related data
      clearAllStoredData();
      setupModalForConnection();
    } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
      errorMsg += 'Access denied. Check your subscription.';
    } else if (error.message.includes('Network')) {
      errorMsg += 'Network error. Please try again.';
    } else {
      errorMsg += error.message || 'Unknown error occurred.';
    }

    errorMessage.textContent = errorMsg;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
  }
};

// Helper function to clear all stored data
const clearAllStoredData = () => {
  const keysToRemove = [
    'nordvpn_access_token',
    'nordvpn_connected_server_id',
    'nordvpn_connected_server_name',
    'nordvpn_connected_server_ip',
    'nordvpn_connected_server_load',
    'nordvpn_credentials_id',
    'nordvpn_credentials_username',
    'nordvpn_credentials_password',
    'nordvpn_credentials_nordlynx_key',
    'nordvpn_credentials_created_at',
    'nordvpn_credentials_updated_at',
    'nordvpn_connected_at',
    'nordvpn_connection_simulated'
    // NOTE: δεν περιλαμβάνουμε το 'nordvpn_theme'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
};

const fetchUserCredentials = async (token) => {
  const targetUrl = 'https://api.nordvpn.com/v1/users/services/credentials';
  const authString = `token:${token}`;
  const credentials = btoa(authString);

  // console.log('Testing working CORS proxies for credentials...');

  // Try CORS.LOL first (most promising from research)
  try {
    // console.log('Trying CORS.LOL...');
    const corsLolUrl = 'https://api.cors.lol/?url=' + encodeURIComponent(targetUrl);

    const response = await fetch(corsLolUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      }
    });

    // console.log('CORS.LOL response:', response.status);

    if (response.ok) {
      const data = await response.json();
      // console.log('CORS.LOL success:', data);
      return data;
    } else {
      const errorText = await response.text();
      // console.log('CORS.LOL error:', errorText);
      throw new Error(`CORS.LOL failed: ${response.status}`);
    }

  } catch (corsLolError) {
    // console.log('CORS.LOL failed:', corsLolError.message);
  }

  // Try CORS.SH with required headers
  try {
    // console.log('Trying CORS.SH...');
    const corsSHUrl = 'https://proxy.cors.sh/' + targetUrl;

    const response = await fetch(corsSHUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
        'Origin': window.location.origin,
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    // console.log('CORS.SH response:', response.status);

    if (response.ok) {
      const data = await response.json();
      // console.log('CORS.SH success:', data);
      return data;
    } else {
      const errorText = await response.text();
      // console.log('CORS.SH error:', errorText);
      throw new Error(`CORS.SH failed: ${response.status}`);
    }

  } catch (corsSHError) {
    // console.log('CORS.SH failed:', corsSHError.message);
  }

  // Try updated CorsProxy.io format
  try {
    // console.log('Trying updated CorsProxy.io...');
    const corsProxyUrl = 'https://corsproxy.io/?url=' + encodeURIComponent(targetUrl);

    const response = await fetch(corsProxyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      }
    });

    // console.log('CorsProxy.io response:', response.status);

    if (response.ok) {
      const data = await response.json();
      // console.log('CorsProxy.io success:', data);
      return data;
    } else {
      const errorText = await response.text();
      // console.log('CorsProxy.io error:', errorText);
      throw new Error(`CorsProxy.io failed: ${response.status}`);
    }

  } catch (corsProxyError) {
    // console.log('CorsProxy.io failed:', corsProxyError.message);
  }

  // If all proxies fail, fall back to simulation
  console.warn('All CORS proxies failed, using simulation...');
  return await simulateCredentials(token);
};

const simulateCredentials = async (token) => {
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    id: Math.floor(Math.random() * 1000000000),
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    username: generateVPNUsername(),
    password: generateVPNPassword(),
    nordlynx_private_key: generateNordLynxKey(),
    note: "⚠️ Simulated - Working proxies failed",
    server_details: {
      ip: selectedServer?.station,
      name: selectedServer?.name,
      load: selectedServer?.load
    }
  };
};

const handleDisconnect = () => {
  const connectBtn = document.getElementById('connect-btn');
  const successMessage = document.getElementById('success-message');

  connectBtn.textContent = 'Disconnecting...';
  connectBtn.disabled = true;

  setTimeout(() => {
    // Get server name before clearing data
    const serverName = localStorage.getItem('nordvpn_connected_server_name') || selectedServer.name;

    // Remove only connection-related data, keep the token
    const keysToRemove = [
      'nordvpn_connected_server_id',
      'nordvpn_connected_server_name',
      'nordvpn_connected_server_ip',
      'nordvpn_connected_server_load',
      'nordvpn_credentials_id',
      'nordvpn_credentials_username',
      'nordvpn_credentials_password',
      'nordvpn_credentials_nordlynx_key',
      'nordvpn_credentials_created_at',
      'nordvpn_credentials_updated_at',
      'nordvpn_connected_at',
      'nordvpn_connection_simulated'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // console.log('Disconnected from server:', selectedServer);

    // Update UI to show disconnected state
    connectBtn.textContent = 'Connect';
    connectBtn.className = 'btn btn-primary';
    connectBtn.disabled = false;

    successMessage.innerHTML = `<strong>Disconnected from ${serverName}</strong>`;
    successMessage.style.display = 'block';

    // Auto-close modal after disconnect
    setTimeout(() => {
      closeModal();
    }, 1500);

  }, 1000);
};

const clearStoredToken = () => {
  if (!confirm('Are you sure you want to clear the stored access token? You will need to enter it again next time.')) {
    return;
  }

  localStorage.removeItem('nordvpn_access_token');
  localStorage.removeItem('nordvpn_connected_server');
  localStorage.removeItem('nordvpn_user_credentials');

  // console.log('Cleared stored access token and credentials');

  // Reset modal UI
  setupModalForConnection();
};

const generateWireGuardConfig = () => {
  // Get stored connection data
  const serverName = localStorage.getItem('nordvpn_connected_server_name') || 'Unknown Server';
  const serverIP = localStorage.getItem('nordvpn_connected_server_ip') || 'N/A';
  const serverLoad = localStorage.getItem('nordvpn_connected_server_load') || '0';
  const connectedAt = localStorage.getItem('nordvpn_connected_at');
  const privateKey = localStorage.getItem('nordvpn_credentials_nordlynx_key') || 'N/A';
  const isSimulated = localStorage.getItem('nordvpn_connection_simulated') === 'true';

  // Get server location info
  const countryName = selectedServer?.locations?.[0]?.country?.name || 'Unknown';
  const cityName = selectedServer?.locations?.[0]?.country?.city?.name || 'Unknown';
  const hostname = selectedServer?.hostname || 'unknown.nordvpn.com';

  // Find WireGuard technology for public key
  const wireguardTech = selectedServer?.technologies?.find(tech => tech.identifier === 'wireguard_udp');
  const serverPublicKey = wireguardTech?.metadata?.find(meta => meta.name === 'public_key')?.value || 'PublicKeyNotAvailable';

  const generatedTime = connectedAt ? new Date(connectedAt).toLocaleString() : new Date().toLocaleString();

  const configContent = `# NordVPN WireGuard Configuration
# Server: ${hostname}
# Location: ${cityName}, ${countryName}
# Server Load: ${serverLoad}%
# Generated: ${generatedTime}
${isSimulated ? '# WARNING: This configuration uses simulated credentials for demo purposes\n' : ''}
[Interface]
PrivateKey = ${privateKey}
Address = 10.5.0.2/32
DNS = 103.86.96.100,103.86.99.100

[Peer]
PublicKey = ${serverPublicKey}
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = ${serverIP}:51820
PersistentKeepalive = 25
`;

  return configContent;
};

const downloadWireGuardConfig = () => {
  // Check if user is connected
  const connectedServerId = localStorage.getItem('nordvpn_connected_server_id');
  if (!connectedServerId) {
    alert('Please connect to a server first before downloading the configuration.');
    return;
  }
  
  try {
    const configContent = generateWireGuardConfig();
    const hostname = selectedServer?.hostname || 'unknown-server';
    
    // Replace dots with underscores for filename
    const cleanHostname = hostname.replace(/\./g, '_');
    const filename = `${cleanHostname}.conf`;
    
    // Create blob and download
    const blob = new Blob([configContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // console.log(`Downloaded WireGuard config: ${filename}`);
    
  } catch (error) {
    console.error('Failed to download config:', error);
    alert('Failed to download configuration file. Please try again.');
  }
};

// Theme Management
const initializeTheme = () => {
  const themeCheckbox = document.getElementById('theme-checkbox');
  
  // Check if element exists
  if (!themeCheckbox) {
    console.warn('Theme checkbox not found in DOM');
    return;
  }
  
  const savedTheme = localStorage.getItem('nordvpn_theme') || 'light';
  
  // Set initial theme
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeCheckbox.checked = savedTheme === 'dark';
  
  // Add event listener
  themeCheckbox.addEventListener('change', toggleTheme);
  
  // console.log(`Theme initialized: ${savedTheme}`);
};

const toggleTheme = () => {
  const themeCheckbox = document.getElementById('theme-checkbox');
  
  if (!themeCheckbox) {
    console.warn('Theme checkbox not found');
    return;
  }
  
  const newTheme = themeCheckbox.checked ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('nordvpn_theme', newTheme);
  
  // console.log(`Theme switched to: ${newTheme}`);
};

// Setup modal event listeners
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  fetchNordVPN();

  // Modal event listeners
  const modal = document.getElementById('serverModal');
  const closeBtn = document.querySelector('.close');
  const cancelBtn = document.getElementById('cancel-btn');
  const connectBtn = document.getElementById('connect-btn');
  const clearTokenBtn = document.getElementById('clear-token-btn');

  // Close modal events
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // Clear token button event
  clearTokenBtn.addEventListener('click', clearStoredToken);
  // Στο DOMContentLoaded event listener, πρόσθεσε:
  const downloadBtn = document.getElementById('download-config-btn');
  downloadBtn.addEventListener('click', downloadWireGuardConfig);

  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Connect/Disconnect button event
  connectBtn.addEventListener('click', validateAndConnect);

  // Enter key in input field (only when not disabled)
  document.getElementById('access-token').addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.target.disabled) {
      validateAndConnect();
    }
  });

  // Escape key to close modal
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.style.display === 'block') {
      closeModal();
    }
  });
});

