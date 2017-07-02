var request = require( 'request' );
var fs = require( 'fs' );

var _stISysFolder = "tmp";
var _stISysFile = "StISys.html";

function getCurrentStISys(callback) {
  request( "https://stisys.haw-hamburg.de/", function( error, response, body ) {
    if ( error ) {
      console.log( error );
      return;
    }
    if ( response.statusCode != 200 ) {
      console.log( "StISys down: " + response.statusCode + " " + response.statusMessage );
      return;
    }

    var match = /;jsessionid=[^"]+/.exec(body);
    var tmp = body.replace(match[0], "");

    compareToOldStISys(tmp, callback);
  } );
}

function compareToOldStISys(currentStISys, callback) {
  try {
    fs.mkdirSync( _stISysFolder, '0755' );
  } catch ( e ) {}

  try {
    var oldStISys = fs.readFileSync( _stISysFolder + "/" + _stISysFile, 'utf8' );
  } catch ( e ) {
    fs.writeFileSync( _stISysFolder + "/" + _stISysFile, currentStISys, 'utf8' );
    callback();
    return;
  }

  if (currentStISys === oldStISys) {
    callback(false);
    return;
  } else {
    fs.writeFileSync( _stISysFolder + "/" + _stISysFile, currentStISys, 'utf8' );
    callback(true);
  }
}

function displayStuff(hasChanged) {
  console.log("StISys has changed: " + hasChanged);
}

module.exports = function (callback, delay) {
  getCurrentStISys(callback);
  return setInterval(getCurrentStISys, delay, callback);
};
