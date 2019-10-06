// Here's where we'll code the functions that will be called for the various routes that the user might POST or GET on our API/microservice/website/app:
const ShortUrl = require('./urlModel'); //  NB: Capitalized because this is a Model/constructor
const dns = require("dns");    // We'll be using this node.js core module (no need to have it as a dependency in package.json) to determine if the URLs POSTed to our API are valid


//////////////////////////////////
////////// POST Request: /////////
//////////////////////////////////

// For our server.js file to have access to the following function, we'll define it as an exported object so that it is available throughout our Node.js implementation:
// It'll get called whenever there is a POST event at /api/shorturl/new

exports.postLongUrl = function(req, res) {

  // Next we'll break the requested URL into useful pieces:
  let reqUrl = req.body.url;
  let protocol = reqUrl.substring(0, reqUrl.indexOf("://") + 3);
  let urlWithSubdir = reqUrl.substring(protocol.length);
  let hostName = "";    // dns.lookup() needs to be passed only the hostname (e.g. www.wikipedia.org), otherwise it'll throw "Error: getaddrinfo ENOTFOUND".
  
  // The reqUrl may have trailing subdirectories and files. Because dns.lookup() can't handle these, we'll save only the hostname (e.g. www.wikipedia.org) as its own variable:
  if (urlWithSubdir.indexOf("/") >= 0) {
    // If the URL has subdirectories, remove them and save the result as hostname:
    hostName = urlWithSubdir.substring(0, urlWithSubdir.indexOf("/"));
  }
  else {
    // If the URL doesn't have subdirectories, then hostname should be set equal to urlWithSubdir:
    hostName = urlWithSubdir;
  };
  
  
  // With our reqUrl now chopped up into pieces that we can more easily use, let's carry on:
  // The project requires that POSTed URLs be in the format of: http(s)://www.example.com(/more/routes). Let's check to see if our URL has the correct protocol:
  if (protocol != "http://" && protocol != "https://") {
    // Looks like the POSTed URL doesn't pass the format test, so as per the user stories we'll return a JSON object error message:
    return res.json( {"error": "invalid URL"} );
  };

  dns.lookup(hostName, function(err, address) {
    if (err) {
      // Looks like that hostname isn't resolving/valid, so let's return an appropriate error message:
      return res.json( {"error": "invalid hostname"} )
    }
    else {
      // The hostname for the POSTed URL must be valid.
      // Next, let's check to see if we already have it in our database:

      ShortUrl
      .find()
      .sort( {short_url: -1} )
      .limit(1)
      .exec(function(err, data) {
        // We'll handle any connection-related errors first:
        if (err) return console.log("Error:", err);

        let last_count = 0;
        let entry = true;
        // If there are no errors, we'll check to see if we received any data:
        if (data.length > 0) {
          if (data[0].original_url == reqUrl) {
            // If we receive some data back from our query, then the reqUrl is already in our database, so we'll simply return its data:
            entry = false;
            return res.json({
              "original_url": reqUrl,
              "short_url": data[0].short_url
            });
          }else{
            last_count = data[0].short_url+1; // It Looks like we have some Documents/Instances in our database already. Let's save the max value to our variable:
          }
        }

        if(entry){
          let newEntry = new ShortUrl({
            "original_url": reqUrl,
            "short_url": last_count
          });

            // ... and save it to the DB:
            newEntry.save(function(err, data) {
              if (err) return console.log("Error:", err);
              // Once the new entry has been saved to our DB, we'll respond to the user's POST with a JSON object file, as per the user story requirements:
              return res.json({
                "original_url": reqUrl,
                "short_url": last_count
              });
            });
          }
        
        });


    }  // END of big ELSE statement within our dns.lookup() effort
  });  // END of logic related to our dns.lookup() effort

};  // END of .postLongUrl()



//////////////////////////////////
////////// GET Request: /////////
//////////////////////////////////

// For our server.js file to have access to the following function, we'll define it as an exported object so that it is available throughout our Node.js implementation:
// It'll get called whenever there is a GET event at /api/shorturl/:short_url

exports.getShortUrl = function(req, res) {  
  // We'll look through our MongoDB to see if we have a matching Document/Instance using the short URL number passed by the user (i.e. .../api/shorturl/<short_url> ):
  let shortUrl = req.params.short_url;
  
  // According to the user stories, the short URL is supposed to be a number, so rather than risk wasting time and energy checking through our databse for invalid entries
  // that wouldn't be in there anyways, let's take a second to check that the user has requested a valid short URL (i.e. a number)
  // The contents of shortURL will be a string, so we'll try to convert it to a number by adding it to nothing. This little trick returns NaN unless ALL the characters in the string are numbers.
  // Keep in mind that the only way to check for NaN is with isNaN(). NaN === NaN resolves to false. Also, parseInt("12px") returns 12, which is why we don't use this method.
  if ( isNaN(shortUrl ) ) {
    // It appears that the requested short URL is not in the correct format, so let's let the user know:
    // NB: process.env.PWD is the working directory when the process was started, and stays the same for the entire process, unlike __dirname and process.cwd().
    res.status(404).json({"error":"invalid URL"});
  }
  else {
    // if the shortUrl is a valid number, then we'll go ahead and check if we already have it saved in our DB using .findOne():
    ShortUrl
      .findOne( {"short_url": shortUrl}, function(err, data) {
        // We'll handle any errors arrising from communicating with the remote DB:
        if (err) return console.log("Error:", err);      
        // If there are no errors, then we might have received some data from our query:
        if (data) {
          // If we have a matching entry in our database (i.e. we received some data from our query), we can simply redirect the user to the associated long-form URL:
          res.redirect(data.original_url);
        }
        else {
          // If we don't have matching data in our database, then we must conclude that the user has tried to navigate to non-existing short_url page on the site:
          res.status(404).json({"error":"invalid URL"});
        }
    });
    
  }  // END of else statement (i.e. when requested short URL is valid)  
};  // END of exports.getShortUrl()
