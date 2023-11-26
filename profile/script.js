const info = document.getElementById("info");
const address = document.getElementById("address");
const addresstext = document.getElementById("addresstext");
const loader = document.getElementById("loader");

const mainContainer = document.getElementById("maincontainer");
const containerCreamies = document.getElementById("nftcontainerCreamies");
var imagesCreamies = document.getElementsByClassName("nftimageCreamies");
var linkCreamies = document.getElementsByClassName("nftlinkCreamies");
var itemsCreamies = document.getElementsByClassName("nftitemsCreamies");
var namesCreamies = document.getElementsByClassName("nftnameCreamies");

const containerOthers = document.getElementById("nftcontainerOthers");
var imagesOthers = document.getElementsByClassName("nftimageOthers");
var linkOthers = document.getElementsByClassName("nftlinkOthers");
var itemsOthers = document.getElementsByClassName("nftitemsOthers");
var namesOthers = document.getElementsByClassName("nftnameOthers");

const nothingCreamies = document.getElementById("nothingCreamies");
const nothingOthers = document.getElementById("nothingOthers");

var indexCreamies = new Array();
var indexOthers = new Array();
var account;



//Fetch Member Info from Soonaverse
async function getMember(uid) {

  let join = []; let response; let data;
  let length = 100;
  let type = "owner";
  let url = "https://api.build5.com/api/getMany?collection=nft&fieldName=" + type + "&fieldValue=" + uid;
  let publicToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiIweDU1MWZkMmM3YzdiZjM1NmJhYzE5NDU4N2RhYjJmY2Q0NjQyMDA1NGIiLCJwcm9qZWN0IjoiMHg0NjIyM2VkZDQxNTc2MzVkZmM2Mzk5MTU1NjA5ZjMwMWRlY2JmZDg4IiwiaWF0IjoxNzAwMDAyODkwfQ.IYZvBRuCiN0uYORKnVJ0SzT_1H_2o5xyDBG20VmnTQ0";

  //Solange bis Liste aller NFTs in der Collection empfangen sind, do this.
  //Wenn weniger als 100 empfangen werden, dann ist es die letze Page in der API
  while (length == 100) {
    response = await fetch(url, { headers: { Authorization: 'Bearer ' + publicToken } });
    data = await response.json();

    if (url.search("startAfter") == -1) {
      url = url + "&startAfter=" + data[data.length - 1].id;
    } else {
      url = url.substring(0, url.length - 42);
      url = url + data[data.length - 1].id;
    }
    join = join.concat(data);
    length = data.length;
    info.textContent = join.length + " NFTs loaded...";
  }

  return data;
}

async function getAccount() {
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  account = accounts[0];


  getMember(account).then(obj => {

    address.textContent = account;
    loader.style.display = "none";
    addresstext.style.visibility = "visible";
    address.style.visibility = "visible";
    info.style.display = "none";

    if (obj.length > 0) {

      for (var i = 0; i < obj.length; i++) {

        //Check if Creamies or not
        if (obj[i].space == "0xa8e2122d528809861a925d90e5edff5c685825df") {
          indexCreamies.push(i);
        } else {
          indexOthers.push(i);
        }
      }

      //Duplicate
      for (var i = 0; i < indexCreamies.length - 1; i++) {
        var newItem = itemsCreamies[0].cloneNode(true);
        containerCreamies.appendChild(newItem);
      }

      for (var i = 0; i < indexOthers.length - 1; i++) {
        var newItem = itemsOthers[0].cloneNode(true);
        containerOthers.appendChild(newItem);
      }


      //Apply Images for Creamies
      for (var i = 0; i < indexCreamies.length; i++) {
        nothingCreamies.style.display = "none";
        imagesCreamies[i].src = obj[indexCreamies[i]].media;
        namesCreamies[i].textContent = obj[indexCreamies[i]].name;
        linkCreamies[i].href = "https://soonaverse.com/nft/" + obj[indexCreamies[i]].uid;
        itemsCreamies[i].style.visibility = "visible";
      }

      //Apply Images for Others
      for (var i = 0; i < indexOthers.length; i++) {
        nothingOthers.style.display = "none";
        imagesOthers[i].src = obj[indexOthers[i]].media;
        namesOthers[i].textContent = obj[indexOthers[i]].name;
        linkOthers[i].href = "https://soonaverse.com/nft/" + obj[indexOthers[i]].uid;
        itemsOthers[i].style.visibility = "visible";
      }

      //Make visible
      mainContainer.style.visibility = "visible";

    } else {
      mainContainer.style.visibility = "visible";
    }
  });
}

//On Load
window.addEventListener('DOMContentLoaded', () => {
  //-----------------------------MENU---------------------------------
  document.getElementById("menu-bar").onclick = function () {
    document.getElementById("menu-bar").classList.toggle("change");
    document.getElementById("nav").classList.toggle("change");
    document.getElementById("menu-bg").classList.toggle("change-bg");
  }
  //----------------------------MENU END-------------------------------

  if (typeof window.ethereum !== 'undefined') {
    getAccount();
  } else {
    loader.style.display = "none";
    info.textContent = 'MetaMask not installed!';
  }
});