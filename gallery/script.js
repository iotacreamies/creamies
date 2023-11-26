//Variables
var gridSelector = "";
var flavorSelector = "";
var waffleSelector = "";
var iotaSelector = "";
var expressionSelector = "";
var accessorySelector = "";
var numberSelector = "";
var availableSelector = "";
var sorted = 0;
var available = 1;
var randomFlavor;
var nftarray;
var nftadresses = [];

var resetButtons = document.getElementsByClassName("resetButton");
var flavorSelect = document.getElementById("selectFlavor");
var iotaSelect = document.getElementById("selectIota");
var waffleSelect = document.getElementById("selectWaffle");
var expressionSelect = document.getElementById("selectExpression");
var accessorySelect = document.getElementById("selectAccessory");
var counterElement = document.getElementById("counter");
var counterContainerElement = document.getElementById("countercontainer");
var sortbyContainerElement = document.getElementById("sortbyContainer");
var availableContainerElement = document.getElementById("availableContainer");
var sortbySelect = document.getElementById("sortby");
var availableSelect = document.getElementById("available");
var typeNumberInput = document.getElementById("typeNumber");
var selectContainer = document.getElementById("selectContainer");
var filterDescription = document.getElementById("filterDescription");
var ownedContainerElement = document.getElementsByClassName("nftownedcontainer");
var poweredIOTA = document.getElementById("powered");
var loaderElement = document.getElementById("loader");
var loaderText = document.getElementById("loaderText");


//-------------------------------------------FUNCTIONS------------------------------------------------
//Set Attributes
function setAttributes(item, number, tier, waffle, flavor, iota, expression, accessory, available) {
    item.setAttribute("number", number);
    item.setAttribute("tier", tier);
    item.setAttribute("waffle", waffle);
    item.setAttribute("flavor", flavor);
    item.setAttribute("iota", iota);
    item.setAttribute("expression", expression);
    item.setAttribute("accessory", accessory);
    item.setAttribute("available", available);
}


//Fetch NFT List from Soonaverse
async function getNFTs(type, uids = [uid_1, uid_2, uid_3, uid_4]) {
    let array = [];
    for (const uid of uids) {
        let length = 100, response, data, join = [];
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
            loaderText.textContent = array.length + join.length + " NFTs loaded...";

        }
        //Führe beide arrays zusammen
        array = array.concat(join);
    }
    return array;
}


//Random Int Generator
function generateRandomInteger(min, max) {
    return Math.floor(min + Math.random() * (max + 1 - min))
}

//Shuffle Array
function shuffle(arr) {
    var array = arr;
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)); //random index
        [arr[i], arr[j]] = [arr[j], arr[i]]; // swap
    }
    return array;
}

//Get active items from grid
function activeItems(grid) {
    var items = grid.getItems().filter(function (item) {
        return item.isActive();
    });
    return items;
}

//Grid Filter
function filterGrid(grid, sel) {
    //Add to Selector
    if (sel.id == "selectFlavor" && sel.selectedIndex != 0) { flavorSelector = '[flavor="' + sel.options[sel.selectedIndex].id + '"]'; }
    if (sel.id == "selectWaffle" && sel.selectedIndex != 0) { waffleSelector = '[waffle="' + sel.options[sel.selectedIndex].id + '"]'; }
    if (sel.id == "selectIota" && sel.selectedIndex != 0) { iotaSelector = '[iota="' + sel.options[sel.selectedIndex].id + '"]'; }
    if (sel.id == "selectExpression" && sel.selectedIndex != 0) { expressionSelector = '[expression="' + sel.options[sel.selectedIndex].id + '"]'; }
    if (sel.id == "selectAccessory" && sel.selectedIndex != 0) { accessorySelector = '[accessory="' + sel.options[sel.selectedIndex].id + '"]'; }

    if (sel.id == "selectFlavor" && sel.selectedIndex == 0) { flavorSelector = "[flavor]"; }
    if (sel.id == "selectWaffle" && sel.selectedIndex == 0) { waffleSelector = "[waffle]"; }
    if (sel.id == "selectIota" && sel.selectedIndex == 0) { iotaSelector = "[iota]"; }
    if (sel.id == "selectExpression" && sel.selectedIndex == 0) { expressionSelector = "[expression]"; }
    if (sel.id == "selectAccessory" && sel.selectedIndex == 0) { accessorySelector = "[accessory]"; }


    if (sel.id == "typeNumber" && sel.value != "" && sel.value != "0") {
        flavorSelect.selectedIndex = 0;
        waffleSelect.selectedIndex = 0;
        iotaSelect.selectedIndex = 0;
        expressionSelect.selectedIndex = 0;
        accessorySelect.selectedIndex = 0;
        flavorSelector = "[flavor]";
        waffleSelector = "[waffle]";
        iotaSelector = "[iota]";
        expressionSelector = "[expression]";
        accessorySelector = "[accessory]";
        availableSelector = "[available]";
        availableSelect.textContent = "All NFTs";
        available = 1;
        numberSelector = '[number="' + typeNumberInput.value + '"]';
    } else if (sel.id == "typeNumber") {
        //Filter nach Random Flavor (saves Performance from the start)
        flavorSelect.selectedIndex = randomFlavor;
        flavorSelector = "[flavor='" + flavorSelect.options[randomFlavor].id + "']";
        typeNumberInput.value = "";
        numberSelector = "[number]";
    }

    //Available Selector
    if (available) { availableSelector = "[available]"; } else { availableSelector = "[available='1']"; }

    gridSelector = numberSelector + flavorSelector + waffleSelector + iotaSelector + expressionSelector + accessorySelector + availableSelector;

    //Cant be empty
    if (gridSelector == "") {
        gridSelector = "[flavor]";
    }

    //Magic
    grid.filter(gridSelector);
    counterElement.textContent = activeItems(grid).length;
}
//-------------------------------------------FUNCTIONS END------------------------------------------------


//On Load
window.addEventListener('DOMContentLoaded', () => {

    loaderText.textContent = "Loading gallery...";
    //--------------------------------------------NFT PAGE GRID---------------------------------------------- 
    var type = "collection";
    var uid_1 = "0x1c9460ebf38ceff31362b708bf4d079ab516246d";
    var uid_2 = "0x2c4ba46d0c76184f368a789141d8affe86f1d818";
    var uid_3 = "0xa362da9efdecc02482d76db36138dbef2e80fff3";
    var uid_4 = "0xdedd84cdd2ee62957ddb8f915cfadfe1555f5a35";
    getNFTs(type, [uid_1, uid_2, uid_3, uid_4]).then(obj => {

        //Give every NFT a number value - some don't have this
        for (var i = 0; i < obj.length; i++) {
            if (!obj[i].stats.number) {
                obj[i].stats.number = {};
                obj[i].stats.number.label = "Number";
                switch (obj[i].properties.flavor.value) {
                    case "Gold": obj[i].stats.number.value = "1"; break;
                    case "Silver": obj[i].stats.number.value = "2"; break;
                    case "Rose gold": obj[i].stats.number.value = "3"; break;
                }
            }
        }

        //Sort by number of NFT
        obj.sort((a, b) => a.stats.number.value - b.stats.number.value);

        //Proxy Elements
        var itemElement = document.getElementsByClassName("item")[0];
        var gridElement = document.getElementsByClassName("grid")[0];

        //Duplicate Elements
        for (var i = 0; i < obj.length - 1; i++) {
            var newItem = itemElement.cloneNode(true);
            gridElement.appendChild(newItem);
        }

        var nftImages = document.getElementsByClassName("nftimage");
        var nftNumbers = document.getElementsByClassName("nftnumber");
        var buyLinks = document.getElementsByClassName("buyLink");
        var mintButtons = document.getElementsByClassName("mintButton");

        //Apply Images
        for (var i = 0; i < obj.length; i++) {

            var item = document.getElementsByClassName("item")[i];

            //-------------Find image in folder from data from Soonaverse---------------------
            if (obj[i].collection == "0xa362da9efdecc02482d76db36138dbef2e80fff3") {
                //Gold, Silver, Rosegold
                switch (obj[i].properties.flavor.value) {
                    case "Gold": nftImages[i].setAttribute("data-src", "../assets/nft_gold/gold.png"); break;
                    case "Silver": nftImages[i].setAttribute("data-src", "../assets/nft_gold/silver.png"); break;
                    case "Rose gold": nftImages[i].setAttribute("data-src", "../assets/nft_gold/rosegold.png"); break;
                }
                setAttributes(item, obj[i].stats.number.value, "-", "-", obj[i].properties.flavor.value, obj[i].properties.logo.value, "-", "-", obj[i].available);
            } else if (obj[i].collection == "0xdedd84cdd2ee62957ddb8f915cfadfe1555f5a35") {
                //Crowns
                switch (obj[i].properties.flavor.value) {
                    case "Gold": nftImages[i].setAttribute("data-src", "../assets/nft_gold/gold_crown.webp"); break;
                    case "Silver": nftImages[i].setAttribute("data-src", "../assets/nft_gold/silver_crown.webp"); break;
                    case "Rose gold": nftImages[i].setAttribute("data-src", "../assets/nft_gold/rosegold_crown.webp"); break;
                }
                setAttributes(item, obj[i].stats.number.value, "-", "-", obj[i].properties.flavor.value, obj[i].properties.logo.value, "-", obj[i].properties.accessory.value, obj[i].available);
            } else {
                //All other collecitons
                var number, tier, flavor, waffle, expression, accessory, nftImageName;

                number = obj[i].stats.number.value;
                tier = obj[i].properties.tier.value;
                if (tier.length === 1) {  // Check if the string has only one character
                    tier = "0" + tier;  // Prepend a "0" to the string
                }
                flavor = obj[i].properties.flavor.value.replaceAll(" ", "").replaceAll("&", "").toLowerCase();
                waffle = obj[i].properties.waffle.value.toLowerCase();
                accessory = obj[i].properties.accessory.value.replaceAll(" ", "_").toLowerCase();

                //If Creamies collection
                if (obj[i].collection == "0x1c9460ebf38ceff31362b708bf4d079ab516246d") {
                    expression = obj[i].properties.expression.value.toLowerCase();
                }

                //If IOTA collection
                if (obj[i].collection == "0x2c4ba46d0c76184f368a789141d8affe86f1d818") {
                    expression = obj[i].properties.logo.value.replaceAll(" ", "").toLowerCase();
                }

                if (accessory != "none") {
                    nftImageName = number + "_" + tier + "_" + flavor + "_" + waffle + "_" + expression + "_" + accessory + ".jpg";
                } else {
                    nftImageName = number + "_" + tier + "_" + flavor + "_" + waffle + "_" + expression + ".jpg";
                }

                //For some reason its missing the "_glasses" on Soonaverse - special case
                if (nftImageName.includes("1430"))
                    nftImageName = "1430_05_blueberry_white_nervous_glasses.jpg";

                nftImages[i].setAttribute("data-src", "../assets/nft/" + nftImageName);



                //If IOTA collection
                if (obj[i].collection == "0x2c4ba46d0c76184f368a789141d8affe86f1d818")
                    setAttributes(item, obj[i].stats.number.value, obj[i].properties.tier.value, obj[i].properties.waffle.value, obj[i].properties.flavor.value, obj[i].properties.logo.value, "-", obj[i].properties.accessory.value, obj[i].available);
                else
                    setAttributes(item, obj[i].stats.number.value, obj[i].properties.tier.value, obj[i].properties.waffle.value, obj[i].properties.flavor.value, "-", obj[i].properties.expression.value, obj[i].properties.accessory.value, obj[i].available);
            }
            //------------------Find image in folder from data from Soonaverse END---------------------

            buyLinks[i].href = "https://soonaverse.com/nft/" + obj[i].uid;

            //Apply NFT Adresses
            if (obj[i].available) {
                mintButtons[i].textContent = "Buy";
                nftImages[i].style.opacity = 1;
                ownedContainerElement[i].style.display = "none";
            }
        }

        //Initialize Grid
        var grid = new Muuri('.grid', {
            sortData: {
                number: function (item, element) {
                    return parseFloat(element.getAttribute('number'));
                },
                tier: function (item, element) {
                    return parseFloat(element.getAttribute('tier'));
                },
            },
        });

        //----------------------------------LAZY LOADING-------------------------------------
        var lazyloadImages;


        if ("IntersectionObserver" in window) {
            lazyloadImages = document.querySelectorAll("img");

            var imageObserver = new IntersectionObserver(function (entries, observer) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        var image = entry.target;
                        image.src = image.dataset.src;
                        imageObserver.unobserve(image);
                    }
                });
            });

            lazyloadImages.forEach(function (image) {
                imageObserver.observe(image);
            });

        } else {
            var lazyloadThrottleTimeout;
            lazyloadImages = document.querySelectorAll("img");

            function lazyload() {
                if (lazyloadThrottleTimeout) {
                    clearTimeout(lazyloadThrottleTimeout);
                }

                lazyloadThrottleTimeout = setTimeout(function () {
                    var scrollTop = window.pageYOffset;
                    lazyloadImages.forEach(function (img) {
                        if (img.offsetTop < (window.innerHeight + scrollTop)) {
                            img.src = img.dataset.src;
                            //img.classList.remove('lazy');
                        }
                    });
                    if (lazyloadImages.length == 0) {
                        document.removeEventListener("scroll", lazyload);
                        window.removeEventListener("resize", lazyload);
                        window.removeEventListener("orientationChange", lazyload);
                    }
                }, 20);
            }

            document.addEventListener("scroll", lazyload);
            window.addEventListener("resize", lazyload);
            window.addEventListener("orientationChange", lazyload);
        }
        //----------------------------------LAZY LOADING-------------------------------------



        //Filter nach Random Flavor (saves Performance from the start)
        randomFlavor = generateRandomInteger(1, flavorSelect.options.length - 1);
        flavorSelect.selectedIndex = randomFlavor;

        filterGrid(grid, flavorSelect);

        grid.on('layoutEnd', function (items) {
            //Swap out data
            for (var i = 0; i < items.length; i++) {
                var number = items[i].getElement().getAttribute("number");
                var iota = items[i].getElement().getAttribute("iota");
                var expression = items[i].getElement().getAttribute("expression");
                var accessory = items[i].getElement().getAttribute("accessory");
                var tier = items[i].getElement().getAttribute("tier");
                var flavor = items[i].getElement().getAttribute("flavor");
                var waffle = items[i].getElement().getAttribute("waffle");

                if (iota == "") { iota = "-"; }
                if (expression == "") { expression = "-"; }
                if (accessory == "") { accessory = "-"; }

                items[i].getElement().getElementsByClassName("nftnumber")[0].textContent = number;
                items[i].getElement().getElementsByClassName("nftinfotext")[0].innerHTML = "<b>Tier </b>" + tier + "<br><b>Flavor </b>" + flavor + "<br><b>IOTA </b>" + iota + "<br><b>Waffle </b>" + waffle + "<br><b>Expression </b>" + expression + "<br><b>Accessory </b>" + accessory;
            }

            gridElement.style.top = "0px";
            gridElement.style.visibility = "visible";
            selectContainer.style.visibility = "visible";
            filterDescription.style.visibility = "visible";
            counterContainerElement.style.visibility = "visible";
            sortbyContainerElement.style.visibility = "visible";
            availableContainerElement.style.visibility = "visible";
            loaderElement.style.display = "none";
            loaderText.style.display = "none";
            poweredIOTA.id = "poweredAfter";


            //------------------------Center the items----------------------------
            //Count rows
            // Get all active items.
            var activeItems = grid.getItems().filter(function (item) {
                return item.isActive();
            });
            if (activeItems.length > 0) {
                var css = activeItems[0].getElement().style.transform.split(" ")[1];
                var rows;
                for (var i = 0; i < activeItems.length; i++) {
                    if (activeItems[i].getElement().style.transform.split(" ")[1] != css) {
                        rows = i;
                        break;
                    }
                }

                var gridSize = grid.getElement().offsetWidth;
                var itemSize = window.getComputedStyle(grid.getItem(0).getElement()).width;
                var itemMargin = window.getComputedStyle(grid.getItem(0).getElement()).margin;
                var changeLeft = (gridSize - (rows * parseInt(itemSize))) / 2 - (rows * parseInt(itemMargin));
                for (var i = 0; i < activeItems.length; i++) {
                    activeItems[i].getElement().style.left = changeLeft + "px";
                }
            }
            //------------------------Center the items END-------------------------
        });

        //OnChange Apply
        flavorSelect.onchange = function () { filterGrid(grid, this); }
        waffleSelect.onchange = function () { filterGrid(grid, this); }
        iotaSelect.onchange = function () { filterGrid(grid, this); }
        expressionSelect.onchange = function () { filterGrid(grid, this); }
        accessorySelect.onchange = function () { filterGrid(grid, this); }
        typeNumberInput.onchange = function () { filterGrid(grid, this); }

        //Sort
        sortbySelect.onclick = function () {
            if (sorted == 0) {
                sortbySelect.textContent = "Tier ▾";
                sorted = 1;
                grid.sort('tier:desc');
            } else if (sorted == 1) {
                sortbySelect.textContent = "Random";
                sorted = 2;
                grid.sort(shuffle(grid.getItems()));
            } else if (sorted == 2) {
                sortbySelect.textContent = "Number ▴";
                sorted = 0;
                grid.sort('number');
            }
        }

        //Available
        availableSelect.onclick = function () {
            if (!available) {
                availableSelect.textContent = "All NFTs";
                available = 1;
            } else {
                availableSelect.textContent = "Available";
                available = 0;
            }
            filterGrid(grid, availableSelect);
        }
        //-------------------------------------------NFT PAGE GRID END----------------------------------------------

        //-----------------------------MENU---------------------------------
        document.getElementById("menu-bar").onclick = function () {
            document.getElementById("menu-bar").classList.toggle("change");
            document.getElementById("nav").classList.toggle("change");
            document.getElementById("menu-bg").classList.toggle("change-bg");
        }
        //----------------------------MENU END-------------------------------

    });

});