export default {
  // The Managed Components to load, with their settings and permissions
  components: [
    {
      name: 'tic-tac-toe-mc',
      settings: {},
      permissions: [
        'access_client_kv',
        'provide_server_functionality',
        'provide_widget',
        'serve_static_files',
        'server_network_requests',
        'execute_unsafe_scripts',
      ],
    },
  ],
  // The hostname to which WebCM should bind
  hostname: 'localhost',
  // The tracking URL will get all POST requests coming from `webcm.track`
  trackPath: '/webcm/track',
  // The port WebCM should listen to
  port: 1337,
  // Optional: hash key to make sure cookies set by WebCM aren't tampered with
  cookiesKey: 'something-very-secret',
}
