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
      console.log('\n=== August 27 (今日) の勤務データ ===');
      const users = ['kouki0802.ao', 'yuta.takasu', 'ryo4ryo4n66', 'theoj246', 'hinako.tsutsumi2525', 'marikou180522'];
      users.forEach(u => {
        if (aug27[u] !== null && aug27[u] !== undefined) {
          const formatted = aug27[u + '_formatted'];
          console.log(`  ${u}: ${formatted}`);
        }
      });
      console.log('\n※ 開始のみで終了打刻がない場合は表示されません');
    }
    return this;
  },
  end: function() { return this; }
};

handler(req, res);