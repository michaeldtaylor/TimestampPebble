/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
var Accel = require('ui/accel');
var Vibe = require('ui/vibe');

// Show splash screen while waiting for data
var splashWindow = new UI.Window();

// Prepare the accelerometer
Accel.init();

// Text element to inform user
var text = new UI.Text({
  position: new Vector2(0, 0),
  size: new Vector2(144, 168),
  text:'Downloading weather data...',
  font:'GOTHIC_28_BOLD',
  color:'black',
  textOverflow:'wrap',
  textAlign:'center',
  backgroundColor:'white'
});

var weatherUrl = 'http://api.openweathermap.org/data/2.5/forecast?q=Portsmouth';

// Add to splashWindow and show
splashWindow.add(text);
splashWindow.show();

function showWeather(data) {
  var parseFeed = function(data, quantity) {
    var items = [];
    for (var i = 0; i < quantity; i++) {
      // Always upper case the description string
      var title = data.list[i].weather[0].main;
      title = title.charAt(0).toUpperCase() + title.substring(1);

      // Get date/time substring
      var time = data.list[i].dt_txt;
      time = time.substring(time.indexOf('-') + 1, time.indexOf(':') + 3);

      // Add to menu items array
      items.push({
        title:title,
        subtitle:time
      });
    }

    // Finally return whole array
    return items;
  };

  var menuItems = parseFeed(data, 10);

  // Check the items are extracted OK
  for (var i = 0; i < menuItems.length; i++) {
    console.log(menuItems[i].title + ' | ' + menuItems[i].subtitle);
  }

  // Construct Menu to show to user
  var resultsMenu = new UI.Menu({
    sections: [{
      title: 'Current Forecast',
      items: menuItems
    }]
  });
  
  // Add an action for SELECT
  resultsMenu.on('select', function(e) {
    var forecast = data.list[e.itemIndex];
    var content = data.list[e.itemIndex].weather[0].description;
  
    // Capitalize first letter
    content = content.charAt(0).toUpperCase() + content.substring(1);
  
    // Add temperature, pressure etc
    content += '\nTemperature: ' + Math.round(forecast.main.temp - 273.15) + 'deg C' 
      + '\nPressure: ' + Math.round(forecast.main.pressure) + ' mbar'
      + '\nWind: ' + Math.round(forecast.wind.speed) + ' mph, ' + Math.round(forecast.wind.deg) + 'deg';
  
    //console.log('Content: ' + content);
    
    // Create the Card for detailed view
    var detailCard = new UI.Card({
      title:'Details',
      subtitle:e.item.subtitle,
      body: content
    });

    detailCard.show();    
  });

  // Show the Menu, hide the splash
  resultsMenu.show();
  splashWindow.hide();
  
  // Register for 'tap' events
  resultsMenu.on('accelTap', function(e) {
    // Make another request to openweathermap.org
    ajax({
        url: weatherUrl,
        type:'json'
      },
      function(data) {
        // Create an array of Menu items
        var newItems = parseFeed(data, 10);
      
        // Update the Menu's first section
        resultsMenu.items(0, newItems);
        
        // Notify the user
        Vibe.vibrate('short');        
      },
      function(error) {
        console.log('Download failed: ' + error);
      }
    );
  });  
}

ajax({
    url: weatherUrl,
    type:'json'
  },
  showWeather,
  function(error) {
    console.log('Download failed: ' + error);
  }
);