const handler = require('./api/subpage/daily-chart.js').default;

const req = { 
  method: 'GET',
  query: { days: '31', top_users: '5', month_offset: '0' }
};

const res = {
  headers: {},
  setHeader: function(key, value) { this.headers[key] = value; },
  status: function(code) { 
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    const chart_data = data.chart_data || [];
    
    // 最後の5日分を表示
    console.log('Last 5 days:');
    chart_data.slice(-5).forEach(d => {
      console.log(`  Date ${d.date}`);
    });
    
    // 27日のデータを探す
    const aug27 = chart_data.find(d => d.date === '27');
    if (aug27) {
      console.log('\nAugust 27 data FOUND\!');
      // ユーザーのデータを確認
      Object.keys(aug27).forEach(key => {
        if (key \!== 'date' && \!key.includes('_formatted')) {
          console.log(`  ${key}: ${aug27[key]}`);
        }
      });
    } else {
      console.log('\nNO August 27 data\!');
      console.log('All dates:', chart_data.map(d => d.date).join(', '));
    }
    return this;
  },
  end: function() { return this; }
};

handler(req, res);
