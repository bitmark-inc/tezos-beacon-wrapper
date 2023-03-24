var { AuBeaconWrapper } = require('autonomy-beacon-wrapper')
global.window.AuBeaconWrapper = AuBeaconWrapper
var { LoginType } = require('autonomy-beacon-wrapper')
global.window.LoginType = LoginType

const ABW = new AuBeaconWrapper('objkt.com', {name: 'alo', iconUrl:''});
$(document).ready(async function(){
  const btn1 = $(".btn1");
  btn1.css("background-color", "green");
  btn1.css("width", "150px");
  btn1.css("pointer", "pointer");
  btn1.css("height", "100px");
  btn1.css("height", "100px");

  const btn2 = $(".btn2");
  btn2.css("background-color", "red");
  btn2.css("pointer", "pointer");
  btn2.css("width", "150px");
  btn2.css("height", "100px");
  btn2.css("height", "100px");

  if (await ABW.getActiveAccount()) {
    btn1.css("display", "none");
    btn2.css("display", "block");
  } else {
    btn1.css("display", "block");
    btn2.css("display", "none");
  }

  btn1.click(async function(){
    r = await ABW.showConnect();
    if (r === LoginType.Autonomy) {
      console.log("Autonomy logged")
    }
    if (r === LoginType.OtherWallets) {
      console.log("Other wallet logged")
    }
    btn1.css("display", "none");
    btn2.css("display", "block");
  });
  btn2.click(async function(){
    await ABW.removeAllPeers();
    await ABW.clearActiveAccount();
    btn1.css("display", "block");
    btn2.css("display", "none");
  })
});