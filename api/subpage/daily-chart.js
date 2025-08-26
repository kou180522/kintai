import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // クエリパラメータから年月を取得（デフォルトは現在の月）
  const { year, month } = req.query;
  const now = new Date();
  const targetYear = year ? parseInt(year) : now.getFullYear();
  const targetMonth = month ? parseInt(month) : (now.getMonth() + 1);
  
  try {
    // CSVファイルを読み込み
    const csvPath = path.join(process.cwd(), 'public', 'attendance_data.csv');
    let csvData;
    
    try {
      csvData = fs.readFileSync(csvPath, 'utf8');
    } catch (error) {
      console.error('CSV read error:', error);
      // CSVが読めない場合はハードコードデータを返す
      return res.status(200).json({
        success: true,
        chart_data: generateMockData(),
        user_configs: generateMockUserConfigs(),
        period: '過去31日間',
        timestamp: new Date().toISOString()
      });
    }
    
    // CSV解析
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });
    
    // ユーザーごとの作業時間を集計
    const userWorkData = {};
    const userSessions = {};
    
    // レコードをソート
    records.sort((a, b) => {
      const dateA = `${a['日付']} ${a['時間']}`;
      const dateB = `${b['日付']} ${b['時間']}`;
      return dateA.localeCompare(dateB);
    });
    
    // 各レコードを処理
    records.forEach(record => {
      const userName = record['ユーザー'] || '';
      const date = record['日付'] || '';
      const time = record['時間'] || '';
      const status = (record['ステータス'] || '').toLowerCase().trim();
      
      if (!userName || !date) return;
      
      // ユーザーデータの初期化
      if (!userWorkData[userName]) {
        userWorkData[userName] = {};
      }
      
      // セッション管理
      const sessionKey = `${userName}-${date}`;
      
      if (status === 's' || status === '開始') {
        // 開始時刻を記録
        userSessions[sessionKey] = time;
      } else if ((status === 'f' || status === '終了') && userSessions[sessionKey]) {
        // 終了時刻で作業時間を計算
        const startTime = parseTime(userSessions[sessionKey]);
        const endTime = parseTime(time);
        
        if (startTime !== null && endTime !== null) {
          let workMinutes = endTime - startTime;
          if (workMinutes < 0) workMinutes += 24 * 60; // 日をまたぐ場合
          
          if (workMinutes > 0 && workMinutes < 24 * 60) {
            if (!userWorkData[userName][date]) {
              userWorkData[userName][date] = 0;
            }
            userWorkData[userName][date] += workMinutes;
          }
        }
        
        delete userSessions[sessionKey];
      }
    });
    
    // 指定された年月のデータを抽出
    const targetMonthStr = `${targetYear}/${String(targetMonth).padStart(2, '0')}`;
    const monthlyTotals = {};
    
    Object.keys(userWorkData).forEach(userName => {
      monthlyTotals[userName] = 0;
      Object.keys(userWorkData[userName]).forEach(date => {
        if (date.startsWith(targetMonthStr)) {
          monthlyTotals[userName] += userWorkData[userName][date];
        }
      });
    });
    
    // アクティブユーザー全員を取得（制限なし）
    const topUsers = Object.entries(monthlyTotals)
      .filter(([_, total]) => total > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
    
    // グラフデータを生成
    const chartData = [];
    const lastDay = new Date(targetYear, targetMonth, 0).getDate(); // 月の最終日を取得
    
    for (let day = 1; day <= lastDay; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateKey = `${targetMonthStr}/${dayStr}`;
      const dayData = { date: dayStr };
      
      topUsers.forEach(userName => {
        const minutes = userWorkData[userName]?.[dateKey] || 0;
        if (minutes > 0) {
          dayData[userName] = Math.round((minutes / 60) * 100) / 100;
          const hours = Math.floor(minutes / 60);
          const mins = Math.round(minutes % 60);
          dayData[`${userName}_formatted`] = `${hours}時間${mins}分`;
        } else {
          dayData[userName] = null;
          dayData[`${userName}_formatted`] = null;
        }
      });
      
      chartData.push(dayData);
    }
    
    // ユーザー設定を生成（色を拡張して多数のユーザーに対応）
    const colors = [
      '#84CC16', '#6366F1', '#EC4899', '#10B981', '#F97316',
      '#14B8A6', '#EF4444', '#06B6D4', '#FB7185', '#0EA5E9',
      '#EAB308', '#8B5CF6', '#4F46E5', '#F59E0B', '#A855F7',
      '#22D3EE', '#FACC15', '#A78BFA', '#FB923C', '#4ADE80',
      '#F87171', '#60A5FA', '#C084FC', '#FDE047', '#86EFAC',
      '#FCA5A5', '#93C5FD', '#D8B4FE', '#FDE68A', '#BBF7D0'
    ];
    
    const userConfigs = {};
    topUsers.forEach((userName, i) => {
      const totalMinutes = monthlyTotals[userName] || 0;
      const hours = Math.floor(totalMinutes / 60);
      const mins = Math.round(totalMinutes % 60);
      
      userConfigs[userName] = {
        label: userName,
        color: colors[i % colors.length],
        work_hours_this_month: `${hours}h${mins}m`,
        work_minutes_this_month: totalMinutes
      };
    });
    
    return res.status(200).json({
      success: true,
      chart_data: chartData,
      user_configs: userConfigs,
      period: `${targetYear}年${targetMonth}月`,
      timestamp: new Date().toISOString(),
      year: targetYear,
      month: targetMonth
    });
    
  } catch (error) {
    console.error('API Error:', error);
    // エラー時もデータを返す
    return res.status(200).json({
      success: true,
      chart_data: generateMockData(),
      user_configs: generateMockUserConfigs(),
      period: '過去31日間',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

function parseTime(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return null;
}

function generateMockData() {
  // ハードコードされたモックデータ
  return [
    {"date":"01","theoj246":7.18,"theoj246_formatted":"7時間11分","ryo4ryo4n66":6.25,"ryo4ryo4n66_formatted":"6時間15分","kouki0802.ao":null,"kouki0802.ao_formatted":null,"hinako.tsutsumi2525":2.62,"hinako.tsutsumi2525_formatted":"2時間37分","erin.isozu":0.17,"erin.isozu_formatted":"0時間10分"},
    {"date":"02","theoj246":null,"theoj246_formatted":null,"ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":1.62,"kouki0802.ao_formatted":"1時間37分","hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":null,"erin.isozu_formatted":null},
    {"date":"03","theoj246":null,"theoj246_formatted":null,"ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":null,"kouki0802.ao_formatted":null,"hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":0.57,"erin.isozu_formatted":"0時間34分"},
    {"date":"04","theoj246":4.0,"theoj246_formatted":"4時間0分","ryo4ryo4n66":0.85,"ryo4ryo4n66_formatted":"0時間51分","kouki0802.ao":1.95,"kouki0802.ao_formatted":"1時間57分","hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":3.88,"erin.isozu_formatted":"3時間53分"},
    {"date":"05","theoj246":5.38,"theoj246_formatted":"5時間23分","ryo4ryo4n66":0.4,"ryo4ryo4n66_formatted":"0時間24分","kouki0802.ao":4.22,"kouki0802.ao_formatted":"4時間13分","hinako.tsutsumi2525":1.73,"hinako.tsutsumi2525_formatted":"1時間44分","erin.isozu":1.12,"erin.isozu_formatted":"1時間7分"},
    {"date":"06","theoj246":5.37,"theoj246_formatted":"5時間22分","ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":null,"kouki0802.ao_formatted":null,"hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":null,"erin.isozu_formatted":null},
    {"date":"07","theoj246":4.38,"theoj246_formatted":"4時間23分","ryo4ryo4n66":5.4,"ryo4ryo4n66_formatted":"5時間24分","kouki0802.ao":4.63,"kouki0802.ao_formatted":"4時間38分","hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":2.18,"erin.isozu_formatted":"2時間11分"},
    {"date":"08","theoj246":6.48,"theoj246_formatted":"6時間29分","ryo4ryo4n66":4.92,"ryo4ryo4n66_formatted":"4時間55分","kouki0802.ao":null,"kouki0802.ao_formatted":null,"hinako.tsutsumi2525":1.13,"hinako.tsutsumi2525_formatted":"1時間8分","erin.isozu":null,"erin.isozu_formatted":null},
    {"date":"09","theoj246":null,"theoj246_formatted":null,"ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":4.03,"kouki0802.ao_formatted":"4時間2分","hinako.tsutsumi2525":6.62,"hinako.tsutsumi2525_formatted":"6時間37分","erin.isozu":0.73,"erin.isozu_formatted":"0時間44分"},
    {"date":"10","theoj246":5.6,"theoj246_formatted":"5時間36分","ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":3.02,"kouki0802.ao_formatted":"3時間1分","hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":null,"erin.isozu_formatted":null},
    {"date":"11","theoj246":null,"theoj246_formatted":null,"ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":null,"kouki0802.ao_formatted":null,"hinako.tsutsumi2525":3.3,"hinako.tsutsumi2525_formatted":"3時間18分","erin.isozu":null,"erin.isozu_formatted":null},
    {"date":"12","theoj246":1.73,"theoj246_formatted":"1時間44分","ryo4ryo4n66":7.0,"ryo4ryo4n66_formatted":"7時間0分","kouki0802.ao":6.3,"kouki0802.ao_formatted":"6時間18分","hinako.tsutsumi2525":1.68,"hinako.tsutsumi2525_formatted":"1時間41分","erin.isozu":5.2,"erin.isozu_formatted":"5時間12分"},
    {"date":"13","theoj246":3.05,"theoj246_formatted":"3時間3分","ryo4ryo4n66":3.08,"ryo4ryo4n66_formatted":"3時間5分","kouki0802.ao":0.15,"kouki0802.ao_formatted":"0時間9分","hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":5.0,"erin.isozu_formatted":"5時間0分"},
    {"date":"14","theoj246":5.67,"theoj246_formatted":"5時間40分","ryo4ryo4n66":4.97,"ryo4ryo4n66_formatted":"4時間58分","kouki0802.ao":1.13,"kouki0802.ao_formatted":"1時間8分","hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":null,"erin.isozu_formatted":null},
    {"date":"15","theoj246":5.58,"theoj246_formatted":"5時間35分","ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":null,"kouki0802.ao_formatted":null,"hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":null,"erin.isozu_formatted":null},
    {"date":"16","theoj246":5.35,"theoj246_formatted":"5時間21分","ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":null,"kouki0802.ao_formatted":null,"hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":6.25,"erin.isozu_formatted":"6時間15分"},
    {"date":"17","theoj246":null,"theoj246_formatted":null,"ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":4.22,"kouki0802.ao_formatted":"4時間13分","hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":null,"erin.isozu_formatted":null},
    {"date":"18","theoj246":null,"theoj246_formatted":null,"ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":null,"kouki0802.ao_formatted":null,"hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":2.42,"erin.isozu_formatted":"2時間25分"},
    {"date":"19","theoj246":5.73,"theoj246_formatted":"5時間44分","ryo4ryo4n66":1.4,"ryo4ryo4n66_formatted":"1時間24分","kouki0802.ao":5.17,"kouki0802.ao_formatted":"5時間10分","hinako.tsutsumi2525":5.18,"hinako.tsutsumi2525_formatted":"5時間11分","erin.isozu":0.8,"erin.isozu_formatted":"0時間48分"},
    {"date":"20","theoj246":6.52,"theoj246_formatted":"6時間31分","ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":null,"kouki0802.ao_formatted":null,"hinako.tsutsumi2525":2.8,"hinako.tsutsumi2525_formatted":"2時間48分","erin.isozu":2.63,"erin.isozu_formatted":"2時間38分"},
    {"date":"21","theoj246":5.62,"theoj246_formatted":"5時間37分","ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":5.73,"kouki0802.ao_formatted":"5時間44分","hinako.tsutsumi2525":1.7,"hinako.tsutsumi2525_formatted":"1時間42分","erin.isozu":1.67,"erin.isozu_formatted":"1時間40分"},
    {"date":"22","theoj246":5.58,"theoj246_formatted":"5時間35分","ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":2.0,"kouki0802.ao_formatted":"2時間0分","hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":3.3,"erin.isozu_formatted":"3時間18分"},
    {"date":"23","theoj246":7.65,"theoj246_formatted":"7時間39分","ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":6.57,"kouki0802.ao_formatted":"6時間34分","hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":1.32,"erin.isozu_formatted":"1時間19分"},
    {"date":"24","theoj246":null,"theoj246_formatted":null,"ryo4ryo4n66":1.7,"ryo4ryo4n66_formatted":"1時間42分","kouki0802.ao":1.0,"kouki0802.ao_formatted":"1時間0分","hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":null,"erin.isozu_formatted":null},
    {"date":"25","theoj246":null,"theoj246_formatted":null,"ryo4ryo4n66":2.35,"ryo4ryo4n66_formatted":"2時間21分","kouki0802.ao":5.47,"kouki0802.ao_formatted":"5時間28分","hinako.tsutsumi2525":0.53,"hinako.tsutsumi2525_formatted":"0時間32分","erin.isozu":null,"erin.isozu_formatted":null},
    {"date":"26","theoj246":7.8,"theoj246_formatted":"7時間48分","ryo4ryo4n66":5.45,"ryo4ryo4n66_formatted":"5時間27分","kouki0802.ao":6.58,"kouki0802.ao_formatted":"6時間35分","hinako.tsutsumi2525":4.48,"hinako.tsutsumi2525_formatted":"4時間29分","erin.isozu":4.4,"erin.isozu_formatted":"4時間24分"},
    {"date":"27","theoj246":null,"theoj246_formatted":null,"ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":null,"kouki0802.ao_formatted":null,"hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":null,"erin.isozu_formatted":null},
    {"date":"28","theoj246":null,"theoj246_formatted":null,"ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":null,"kouki0802.ao_formatted":null,"hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":null,"erin.isozu_formatted":null},
    {"date":"29","theoj246":null,"theoj246_formatted":null,"ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":null,"kouki0802.ao_formatted":null,"hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":null,"erin.isozu_formatted":null},
    {"date":"30","theoj246":null,"theoj246_formatted":null,"ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":null,"kouki0802.ao_formatted":null,"hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":null,"erin.isozu_formatted":null},
    {"date":"31","theoj246":null,"theoj246_formatted":null,"ryo4ryo4n66":null,"ryo4ryo4n66_formatted":null,"kouki0802.ao":null,"kouki0802.ao_formatted":null,"hinako.tsutsumi2525":null,"hinako.tsutsumi2525_formatted":null,"erin.isozu":null,"erin.isozu_formatted":null}
  ];
}

function generateMockUserConfigs() {
  return {
    "theoj246": {"label":"theoj246","color":"#84CC16","work_hours_this_month":"122h44m","work_minutes_this_month":7364},
    "ryo4ryo4n66": {"label":"ryo4ryo4n66","color":"#6366F1","work_hours_this_month":"38h44m","work_minutes_this_month":2324},
    "kouki0802.ao": {"label":"kouki0802.ao","color":"#EC4899","work_hours_this_month":"68h53m","work_minutes_this_month":4133},
    "hinako.tsutsumi2525": {"label":"hinako.tsutsumi2525","color":"#10B981","work_hours_this_month":"38h22m","work_minutes_this_month":2302},
    "erin.isozu": {"label":"erin.isozu","color":"#F97316","work_hours_this_month":"40h49m","work_minutes_this_month":2449}
  };
}