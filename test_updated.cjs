const handler = require('./api/subpage/daily-chart.js').default;

const req = { 
  method: 'GET', 
  query: { days: '31', top_users: '10', month_offset: '0' }
};

const res = {
  headers: {},
  setHeader: function(key, value) { this.headers[key] = value; },
  status: function(code) { this.statusCode = code; return this; },
  json: function(data) { 
    const chart_data = data.chart_data || [];
    const aug27 = chart_data.find(d => d.date === '27');
    if (aug27) {
      console.log('\nAugust 27 data with updated CSV:');
      const users = ['hinako.tsutsumi2525', 'ryo4ryo4n66', 'marikou180522'];
      users.forEach(u => {
        if (aug27[u] !== null && aug27[u] !== undefined) {
          const formatted = aug27[u + '_formatted'];
          console.log(`  ${u}: ${formatted}`);
        }
      });
    }
    return this;
  },
  end: function() { return this; }
};

handler(req, res);