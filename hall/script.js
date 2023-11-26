const rest = document.getElementById("rest");
const list = document.getElementById("list");
const loaderText = document.getElementById("loaderText");
const loader = document.getElementById("loader");
const container = document.getElementById("rankingcontainer");
const ranking = document.getElementsByClassName("ranking");
const ranking_01 = document.getElementsByClassName("ranking_01");
const ranking_02 = document.getElementsByClassName("ranking_02");
const ranking_03 = document.getElementsByClassName("ranking_03");


//Fetch NFT List from Soonaverse
async function getRankingOfSpace(uid) {

  let join = []; let response; let data;
  let length = 100;
  let type = "space";
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
    loaderText.textContent = join.length + " NFTs loaded...";

  }


  //Determine ranking from data
  const counts = {};
  join.forEach(function (x) { counts[x.owner] = (counts[x.owner] || 0) + 1; });

  //Sort
  let sortable = [];
  for (var entry in counts) {
    sortable.push([entry, counts[entry]]);
  }

  sortable.sort(function (a, b) {
    return b[1] - a[1];
  });

  return sortable;
}


getRankingOfSpace("0xa8e2122d528809861a925d90e5edff5c685825df").then(obj => {


  var addresses = new Array();
  var nfts = new Array();

  for (var i = 0; i < obj.length; i++) {

    //Skip 0 count
    if (i == 0) continue;

    addresses.push(obj[i][0]);
    nfts.push(obj[i][1]);
  }

  //Duplicate Elements
  for (var i = 0; i < addresses.length - 4; i++) {
    var newItem = rest.cloneNode(true);
    list.appendChild(newItem);
  }

  //Update List
  for (var i = 0; i < addresses.length; i++) {
    var rank = i + 1;
    if (rank == 1) { rank = rank + "🥇"; }
    if (rank == 2) { rank = rank + "🥈"; }
    if (rank == 3) { rank = rank + "🥉"; }
    ranking_01[i].textContent = rank;
    ranking_02[i].innerHTML = "<a target='_blank' href='https://soonaverse.com/member/" + addresses[i] + "/nfts'>" + addresses[i] + "</a>";
    ranking_03[i].textContent = nfts[i];
  }

  //Show
  loaderText.style.display = "none";
  loader.style.display = "none";
  container.style.visibility = "visible";

});

//On Load
window.addEventListener('DOMContentLoaded', () => {
  //-----------------------------MENU---------------------------------
  document.getElementById("menu-bar").onclick = function () {
    document.getElementById("menu-bar").classList.toggle("change");
    document.getElementById("nav").classList.toggle("change");
    document.getElementById("menu-bg").classList.toggle("change-bg");
  }
  //----------------------------MENU END-------------------------------
});