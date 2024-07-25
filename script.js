document.addEventListener('DOMContentLoaded', function() {
  const chartOptions = {
      chart: {
          type: 'column',
          options3d: {
              enabled: true,
              alpha: 10,
              beta: 10,
              depth: 70,
              viewDistance: 25
          }
      },
      xAxis: {
          type: 'category',
          labels: {
              style: {
                  fontSize: '15px'
              },
              formatter: function() {
                  const names = {
                      'BTC-USD': 'Bitcoin',
                      'CRUDE_OIL': 'Petrol',
                      'DOW_JONES': 'DowJones',
                      'ETHER': 'Ethereum',
                      'EUR': 'Euro',
                      'GOLD': 'Altın',
                      'NASDAQ100': 'Nasdaq100',
                      'SILVER': 'Gümüş',
                      'SP500': 'SP500'
                  };
                  return names[this.value] || this.value;
              }
          }
      },
      yAxis: {
          title: {
              text: 'Kar/Zarar (USD)'
          },
          labels: {
              style: {
                  fontSize: '15px'
              }
          }
      },
      tooltip: {
          headerFormat: '<b>{point.key}</b><br>',
          pointFormat: 'Kar/Zarar: {point.y:.2f} USD'
      },
      title: {
          text: 'Yatırım Kar/Zarar Analizi',
          align: 'center',
          style: {
              fontSize: '20px'
          }
      },
      subtitle: {
          text: 'Belirtilen tarih aralığında yatırılan 1000 USD',
          align: 'center',
          style: {
              fontSize: '15px'
          }
      },
      legend: {
          enabled: false
      },
      plotOptions: {
          column: {
              depth: 25,
              colorByPoint: true
          }
      },
      series: [{
          data: [],
          colorByPoint: true
      }]
  };

  const chart1 = new Highcharts.Chart('container', chartOptions);
  const chart2 = new Highcharts.Chart('container2', chartOptions);

  function showValues(chart) {
      document.getElementById('alpha-value').innerHTML = chart.options.chart.options3d.alpha;
      document.getElementById('beta-value').innerHTML = chart.options.chart.options3d.beta;
      document.getElementById('depth-value').innerHTML = chart.options.chart.options3d.depth;
  }

  document.querySelectorAll('#sliders input').forEach(input => input.addEventListener('input', e => {
      chart1.options.chart.options3d[e.target.id] = parseFloat(e.target.value);
      chart2.options.chart.options3d[e.target.id] = parseFloat(e.target.value);
      showValues(chart1);
      chart1.redraw(false);
      chart2.redraw(false);
  }));

  showValues(chart1);

  async function loadCSV(file) {
      const response = await fetch(file);
      const data = await response.text();
      return parseCSV(data);
  }

  function parseCSV(data) {
      const lines = data.split('\n');
      const result = {};
      const headers = lines[0].split(',');

      for (let i = 1; i < lines.length; i++) {
          const currentline = lines[i].split(',');
          const date = formatDate(currentline[0]);
          result[date] = {};

          for (let j = 2; j < headers.length; j++) {
              result[date][headers[j]] = parseFloat(currentline[j]);
          }
      }

      return result;
  }

  let csvData = {};

  async function loadAllCSVs() {
      csvData = await loadCSV('merged_data.csv');
      console.log("Loaded CSV Data: ", csvData);
  }

  loadAllCSVs();

  window.calculateProfit = function() {
      const startDate = document.getElementById('start-date').value;
      const endDate = document.getElementById('end-date').value;

      if (!startDate || !endDate) {
          alert('Lütfen geçerli bir tarih aralığı giriniz.');
          return;
      }

      const startPrices = csvData[formatDate(startDate)];
      const endPrices = csvData[formatDate(endDate)];

      if (!startPrices || !endPrices) {
          alert('Belirtilen tarihler arasında veri bulunamadı.');
          return;
      }

      console.log("Start Prices: ", startPrices);
      console.log("End Prices: ", endPrices);

      const investment = 1000;
      const profits = {};

      for (const key in startPrices) {
          if (startPrices[key] && endPrices[key]) {
              const profit = (investment / startPrices[key]) * endPrices[key] - investment;
              profits[key] = profit;
          }
      }

      console.log("Profits: ", profits);

      chart1.series[0].setData(Object.entries(profits).map(([key, value]) => [key, value]));
  }

  function formatDate(date) {
      const d = new Date(date);
      let month = '' + (d.getMonth() + 1);
      let day = '' + d.getDate();
      const year = d.getFullYear();

      if (month.length < 2) month = '0' + month;
      if (day.length < 2) day = '0' + day;

      return [month, day, year].join('/');
  }
});

function fetchData() {
  const stock1 = document.getElementById('stock1').value;
  const stock2 = document.getElementById('stock2').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  const csvFile = `merged_data_filled.csv`;

  fetchCSV(csvFile).then(data => {
      const parsedData = parseCSV(data, startDate, endDate, stock1, stock2);
      updateChart(parsedData, startDate, endDate, stock1, stock2);
  }).catch(error => {
      console.error('Error fetching CSV file:', error);
  });
}

function fetchCSV(filePath) {
  return fetch(filePath)
      .then(response => response.text())
      .then(data => data);
}

function parseCSV(csvData, startDate, endDate, stock1, stock2) {
  const results = Papa.parse(csvData, { header: true });

  const filteredData = results.data.filter(row => {
      const dateStr = row.Date;
      if (!dateStr) {
          console.warn('Missing date field:', row);
          return false; 
      }
      const date = new Date(dateStr).getTime();
      if (!date) {
          console.warn('Invalid date format:', row);
          return false; 
      }
      return date >= new Date(startDate).getTime() && date <= new Date(endDate).getTime();
  });

  return {
      stock1: filteredData.map(row => {
          const date = new Date(row.Date).getTime();
          const price = parseFloat(row[stock1]);
          if (isNaN(price)) {
              console.warn('Invalid price data:', row);
              return null; 
          }
          return {
              date: date,
              price: price
          };
      }).filter(item => item !== null),
      stock2: filteredData.map(row => {
          const date = new Date(row.Date).getTime();
          const price = parseFloat(row[stock2]);
          if (isNaN(price)) {
              console.warn('Invalid price data:', row);
              return null; 
          }
          return {
              date: date,
              price: price
          };
      }).filter(item => item !== null)
  };
}

function updateChart(data, startDate, endDate, stock1, stock2) {
  Highcharts.chart('container2', {
      chart: {
          type: 'spline'
      },
      title: {
          text: 'Currency Comparison'
      },
      subtitle: {
          text: 'Data source: Your CSV file'
      },
      xAxis: {
          type: 'datetime',
          title: {
              text: 'Date'
          },
          min: new Date(startDate).getTime(),
          max: new Date(endDate).getTime()
      },
      yAxis: {
          title: {
              text: 'Price'
          }
      },
      tooltip: {
          crosshairs: true,
          shared: true
      },
      series: [{
          name: stock1,
          marker: {
              symbol: 'square'
          },
          data: data.stock1.map(item => [item.date, item.price])
      }, {
          name: stock2,
          marker: {
              symbol: 'diamond'
          },
          data: data.stock2.map(item => [item.date, item.price])
      }]
  });
}
