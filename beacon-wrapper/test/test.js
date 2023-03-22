var { AuBeaconWrapper } = require('autonomy-beacon-wrapper')
global.window.AuBeaconWrapper = AuBeaconWrapper

const ABW = new AuBeaconWrapper('objkt.com', {name: 'alo', iconUrl:'google.com'});

$(document).ready(function(){
    $(".btn1").click(function(){
      console.log("Calling wrapper");
      ABW.showConnect().then(r => {
        if (r === 1){
          console.log("Au success test");
        } else if (r === 2) {
          console.log("Beacon success test");
        }
      })
    });
});