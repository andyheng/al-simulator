import {data} from "./lib";

// state logic
const constructionState = (() => {
    let state = {
        currentBanner: "",
        currentConstructed: [],
        totalRolls: 0,
        sinceLastSSRCounter: 0,
        rarityCounter: {
            nCount: 0,
            rCount: 0,
            srCount: 0,
            ssrCount: 0
        },
        shipCounter: {
            nShipsCount: {},
            rShipsCount: {},
            srShipsCount: {},
            ssrShipsCount: {}
        }
    }
    const reset = () => {
        state.currentConstructed = [];
        state.totalRolls = 0;
        state.sinceLastSSRCounter = 0;
        state.rarityCounter = { nCount: 0, rCount: 0, srCount: 0, ssrCount: 0 };
        resetShipCounter();
    }
    const setBannerTitle = (title) => {
        state.currentBanner = title;
    }
    const setCurrentConstructedState = (ships) => {
        state.currentConstructed = [...ships]
    }
    const addTotal = () => {
        state.totalRolls += 1;
    }
    const checkIfLastIsSSR = ship => {
        ship.rarity === "SSR" ?
            state.sinceLastSSRCounter = 0 :
            state.sinceLastSSRCounter += 1;
    }
    const addToRarityCounter = ship => {
        const rarityKey = `${ship.rarity.toLowerCase()}Count`;
        state.rarityCounter = {
            ...state.rarityCounter,
            [rarityKey]: state.rarityCounter[rarityKey] += 1
        }
    }

    const setInitialShipCounter = banner => {
        const { ssr, sr, r, n } = banner;
        const reduceObj = arr => {
            return arr.reduce((obj, ship) => {
                obj[ship.name] = { counter: 0 };
                return obj;
            }, {})
        }
        const dataStructure = {
            nShipsCount: reduceObj(n),
            rShipsCount: reduceObj(r),
            srShipsCount: reduceObj(sr),
            ssrShipsCount: reduceObj(ssr)
        }
        state.shipCounter = { ...state.shipCounter, ...dataStructure }
    }

    const addToShipCounter = ship => {
        const addShipKey = [`${ship.rarity.toLowerCase()}ShipsCount`];
        state.shipCounter = {
            ...state.shipCounter,
            [addShipKey]: {
                ...state.shipCounter[addShipKey],
                [ship.name]: {
                    ...state.shipCounter[addShipKey][ship.name],
                    counter: state.shipCounter[addShipKey][ship.name].counter += 1
                }
            }
        }
    }

    const resetShipCounter = () => {
        const { nShipsCount, rShipsCount, srShipsCount, ssrShipsCount } = state.shipCounter;
        const convert = obj => {
            return (
                Object.keys(obj)
                    .map(ship => ({ name: ship, counter: 0 }))
                    .reduce((obj, ship) => {
                        obj[ship.name] = { counter: ship.counter }
                        return obj;
                    }, {})
            )
        }
        const reset = {
            nShipsCount: convert(nShipsCount),
            rShipsCount: convert(rShipsCount),
            srShipsCount: convert(srShipsCount),
            ssrShipsCount: convert(ssrShipsCount)
        }
        state.shipCounter = { ...state.shipCounter, ...reset };
    }

    return {
        publicSetBannerTitle(title) {
            setBannerTitle(title)
        },
        returnTitle() {
            return state.currentBanner
        },
        publicSetInitialShipCounter(banner) {
            setInitialShipCounter(banner)
        },
        publicSetCurrentConstructedState(ships) {
            setCurrentConstructedState(ships)
        },
        returnCurrentConstructed() {
            return state.currentConstructed
        },
        publicAddTotal() {
            addTotal()
        },
        returnTotalRolls() {
            return state.totalRolls
        },
        publicCheckIfLastIsSSR(ship) {
            checkIfLastIsSSR(ship)
        },
        returnLastSSRCounter() {
            return state.sinceLastSSRCounter
        },
        publicAddToRarityCounter(ship) {
            addToRarityCounter(ship)
        },
        returnRarityCounter() {
            return state.rarityCounter
        },
        publicAddToShipCounter(ship) {
            addToShipCounter(ship)
        },
        returnShipCounter() {
            return state.shipCounter
        },
        resetState() {
            reset()
        }
    }
})()

// construction / probability logic
const constructLogic = (ranNum, banner) => {
    // destructure
    const { limited, ships } = banner
    const { ssrRate, srRate, rRate, srThreshold, rThreshold, ssrLimited, srLimited, rLimited } = banner.rates

    // filter array to only limited or perm if limRate arg exists
    // return random ship from filtered array
    const randomShip = (rarity, limRate) => {
        const filteredShips =
            limRate ?
                ships[rarity]
                    .filter(ship => ship.limited && ship.rate === limRate) :
                ships[rarity]
                    .filter(ship => !ship.limited);
        return { ...filteredShips[Math.floor(Math.random() * filteredShips.length)] }
    }

    // logic
    if (ranNum <= ssrRate || ranNum <= srThreshold || ranNum <= rThreshold) {
        const ranNum2 = Math.random();
        const randomResult = (rarity, rate, limitedRates) => {
            const limitedRate1Total = ships[rarity].filter(ship => ship.limited && ship.rate === limitedRates.rate1).length;
            if (limitedRates) {
                if (limitedRates.rate1) {
                    const threshold1 = (limitedRate1Total * limitedRates.rate1) / rate;
                    if (ranNum2 <= threshold1) {
                        return randomShip(rarity, limitedRates.rate1);
                    }
                }
                if (limitedRates.rate2) {
                    const threshold2 = (limitedRates.rate2 / rate) + ((limitedRate1Total * limitedRates.rate1) / rate);
                    if (ranNum2 <= threshold2) {
                        return randomShip(rarity, limitedRates.rate2);
                    }
                }
            }
            return randomShip(rarity);
        }
        // ssr
        if (ranNum <= ssrRate) {
            return randomResult("ssr", ssrRate, ssrLimited)
        }

        // sr
        if (ranNum <= srThreshold) {
            return randomResult("sr", srRate, srLimited)
        }

        // r
        if (ranNum <= rThreshold) {
            return randomResult("r", rRate, rLimited)
        }
    }
    return randomShip("n");
}

// UI management
class UI {
    // static setTitle() {
    //     document.querySelector(".banner_title").textContent = constructionState.returnTitle();
    // }

    static setCurrentSelected(banner) {
        document.querySelector(".banner_dropdown").value = banner.dropdownVal
    }

    static setCurrentRates(banner) {
        const { ssrRate, srRate, rRate } = banner.rates;
        const nRate = (1 - rRate - srRate - ssrRate);
        document.querySelector(".counter_rate-n").innerHTML = `${Math.round(nRate * 100)}%`;
        document.querySelector(".counter_rate-r").innerHTML = `${Math.round(rRate * 100)}%`;
        document.querySelector(".counter_rate-sr").innerHTML = `${Math.round(srRate * 100)}%`;
        document.querySelector(".counter_rate-ssr").innerHTML = `${Math.round(ssrRate * 100)}%`;
    }

    static resetCurrentConstructed() {
        const figures = document.querySelectorAll(".constructions_ship");
        figures.forEach(el => {
            el.classList.add("constructions-hidden");
            el.children[0].src = "";
            el.children[0].alt = "";
            el.children[0].title = "";
            el.children[0].className = "";
            el.children[1].textContent = "";
        })
    }

    static setCurrentConstructed(datasetVal) {
        const shipOne = [document.querySelector(".constructions_1")];
        const shipTen = Array.from(document.querySelectorAll(".constructions_10"));
        const current = constructionState.returnCurrentConstructed();

        const resetPreviousConstructed = (arr) => {
            if (!arr[0].classList.contains("constructions-hidden")) {
                arr.forEach(el => {
                    el.classList.add("constructions-hidden");
                    el.children[0].src = "";
                    el.children[0].alt = "";
                    el.children[0].title = "";
                    el.children[0].className = "";
                    el.children[1].textContent = "";
                })
            }
        }

        const setConstructedData = (arr) => {
            for (let i = 0; i < arr.length; i++) {
                arr[i].classList.remove("constructions-hidden", "limited");
                const img = arr[i].children[0];
                const figcaption = arr[i].children[1];
                img.src = `src/img/ships/${current[i].name.toLowerCase().replace(/\s+/g, "-")}.png`;
                img.alt = current[i].name;
                img.title = current[i].name.replace(/\s+/g, "-");
                img.className = `constructions_ship-${current[i].rarity.toLowerCase()}`;
                if (current[i].limited) arr[i].classList.add("limited");
                figcaption.textContent = current[i].name;
            }
        }

        if (datasetVal === "1") { // roll 1 btn clicked
            resetPreviousConstructed(shipTen); // hide prev 10 rolls
            setConstructedData(shipOne);
        } else {
            resetPreviousConstructed(shipOne); // hide prev 1 rolls
            setConstructedData(shipTen);
        }
    }

    // static updateLastSSR() {
    //     const lastSsrEl = document.querySelector(".stats_last-SSR--value");
    //     lastSsrEl.textContent = `${constructionState.returnLastSSRCounter()}`;
    // }

    static updateRarityCount() {
        const rarities = ["N", "R", "SR", "SSR"];
        const rarityCounter = constructionState.returnRarityCounter();
        const total = constructionState.returnTotalRolls();
        const roundToTwo = num => +(Math.round(num + "e+2") + "e-2");
        rarities.forEach(rarity => {
            const num = total === 0 ? 0 : roundToTwo((rarityCounter[`${rarity.toLowerCase()}Count`] / total) * 100);
            document.querySelector(`.counter_value-${rarity.toLowerCase()}`).textContent = `${rarityCounter[`${rarity.toLowerCase()}Count`]} (${num}%)`
        })
    }

    static setShipCount(banner) {
        const { ssr, sr, r, n } = banner;
        document.querySelectorAll(".counter_ship").forEach(el => el.remove());
        const setShipCounters = (arr, rarity) => {
            arr.forEach(ship => {
                const el = document.createElement("li");
                el.className = "counter_ship";
                const span = document.createElement("span");
                const name = ship.name.replace(/\s+/g, '');
                el.innerHTML = `<img class="counter-img" src=./src/img/ships/${ship.name.toLowerCase().replace(/\s+/g, "-")}.png />`;
                span.innerHTML = "0";
                span.dataset.shipName = name;
                el.appendChild(span);
                document.querySelector(`.counter_ships-${rarity}`).appendChild(el);
            })
        }
        setShipCounters(n, "n");
        setShipCounters(r, "r");
        setShipCounters(sr, "sr");
        setShipCounters(ssr, "ssr");
    }

    static updateShipCount() {
        const { nShipsCount, rShipsCount, srShipsCount, ssrShipsCount } = constructionState.returnShipCounter();
        const updateCount = (obj) => {
            const ships = Object.keys(obj).map(ship => ({ name: ship, counter: obj[ship].counter }))
            ships.forEach(ship => {
                const name = ship.name.replace(/\s+/g, '');
                document.querySelector(`[data-ship-name='${name}']`).textContent = ship.counter
            })
        }
        updateCount(nShipsCount)
        updateCount(rShipsCount)
        updateCount(srShipsCount)
        updateCount(ssrShipsCount)
    }

    static setBannerImage(bannerImage) {
        document.querySelector(".banner_img").src = bannerImage;
    }

    static resetStats() {
        document.querySelector(".stats_total").textContent = 0;
        document.querySelector(".stats_cubes").textContent = 0;
        document.querySelector(".stats_gold").textContent = 0;
    }

    static updateStats(banner) {
        const total = constructionState.returnTotalRolls();
        let cubes,
            gold;
        if (banner.cost === 1) {
            cubes = 1;
            gold = 700;
        } else {
            cubes = 2;
            gold = 1500;
        }
        document.querySelector(".stats_total").textContent = total;
        document.querySelector(".stats_cubes").textContent = total * cubes;
        document.querySelector(".stats_gold").textContent = total * gold;
    }

    static setShowcase(banner) {
        const showcase = document.querySelector(".banner_showcase");
        document.querySelectorAll(".banner_showcase-ship").forEach(el => el.remove());
        const roundToTwo = num => +(Math.round(num + "e+2") + "e-2");
        if (!banner.limited) {
            showcase.classList.add("banner_showcase-hidden");
        } else {
            const merged = [].concat.apply([], Object.values(banner.ships))
            const limited = merged.filter(ship => ship.limited);
            showcase.classList.remove("banner_showcase-hidden");
            limited.forEach(ship => {
                const el = document.createElement("figure");
                const roundedRate = roundToTwo(ship.rate * 100);
                el.className = "banner_showcase-ship";
                el.innerHTML = `
                    <img class="banner_showcase-ship-${ship.rarity.toLowerCase()}" src="./src/img/ships/${ship.name.toLowerCase().replace(/\s+/g, "-")}.png" alt=${ship.name} title=${ship.name.replace(/\s+/g, "-")} />
                    <figcaption>${ship.name}</figcaption>
                    <figcaption>${roundedRate}%</figcaption>
                `
                showcase.appendChild(el);
            })
        }
    }

    static preloadShipImages(banner) {
        const merged = [].concat.apply([], Object.values(banner.ships))
        merged.forEach(ship => {
            let img = new Image();
            img.src = `img/ships/${ship.name.toLowerCase().replace(/\s+/g, "-")}.png`
        })
    }
}

class storage {
    static getCurrentBanner() {
        return !localStorage.getItem("banner") ?
            "" :
            JSON.parse(localStorage.getItem("banner"));
    }
    static setCurrentBanner(banner) {
        localStorage.setItem("banner", JSON.stringify(banner));
    }
}

// construction event logic
// closure to add / remove event listeners
const handleConstructionEvent = (() => {
    let currentBanner;
    const getBanner = (banner) => {
        currentBanner = banner;
    }
    const construct = (datasetVal) => {
        const randomNumArr = datasetVal === "1" ?
            Array.from({ length: 1 }, () => Math.random()) :
            Array.from({ length: 10 }, () => Math.random());
        const constructMap = randomNumArr.map(num => {
            return constructLogic(num, currentBanner);
        })
        constructMap.forEach(ship => {
            constructionState.publicAddTotal()
            constructionState.publicCheckIfLastIsSSR(ship)
            constructionState.publicAddToRarityCounter(ship)
            constructionState.publicAddToShipCounter(ship)
        })
        constructionState.publicSetCurrentConstructedState(constructMap);
        // UI.updateLastSSR();
        UI.setCurrentConstructed(datasetVal);
        UI.updateRarityCount();
        UI.updateShipCount();
        UI.updateStats(currentBanner);
    }

    // change banner fn
    const changeBanner = (banner) => {
        // event handler
        constructBtn.removeEventListener("click", handleConstructionEvent.publicConstruct);
        construct1.removeEventListener("click", handleConstructionEvent.publicConstruct);
        getBanner(banner);
        constructBtn.addEventListener("click", handleConstructionEvent.publicConstruct);
        construct1.addEventListener("click", handleConstructionEvent.publicConstruct);

        // state
        constructionState.resetState();
        constructionState.publicSetBannerTitle(banner.title);
        constructionState.publicSetInitialShipCounter(banner.ships);

        // UI
        // UI.updateLastSSR();
        UI.preloadShipImages(banner);
        UI.setBannerImage(banner.image);
        UI.updateRarityCount();
        UI.setShipCount(banner.ships);
        UI.resetCurrentConstructed();
        UI.setShowcase(banner);
        UI.resetStats();
        UI.setCurrentRates(banner);

        //storage
        storage.setCurrentBanner(banner)
    }
    return {
        publicGetBanner(banner) {
            getBanner(banner)
        },
        publicConstruct(e) {
            construct(e.target.dataset.rollValue);
        },
        publicChangeBanner(banner) {
            changeBanner(banner);
        },
    }
})()

// event listeners

// DOM loaded
document.addEventListener("DOMContentLoaded", () => {
    let currentBanner;
    if (storage.getCurrentBanner()) {
        currentBanner = storage.getCurrentBanner()
    } else {
        currentBanner = data.heavyConstruction;
    }
    handleConstructionEvent.publicGetBanner(currentBanner)
    constructionState.publicSetBannerTitle(currentBanner.title);
    constructionState.publicSetInitialShipCounter(currentBanner.ships);
    UI.setShipCount(currentBanner.ships)
    UI.updateRarityCount()
    UI.setBannerImage(currentBanner.image);
    UI.resetStats();
    UI.setShowcase(currentBanner);
    UI.preloadShipImages(currentBanner);
    UI.setCurrentRates(currentBanner);
    UI.setCurrentSelected(currentBanner);
})

// roll 10 button
const constructBtn = document.querySelector(".btn_construct-10");
constructBtn.dataset.rollValue = 10;
constructBtn.addEventListener("click", handleConstructionEvent.publicConstruct);

// roll 1 button
const construct1 = document.querySelector(".btn_construct-1");
construct1.dataset.rollValue = 1;
construct1.addEventListener("click", handleConstructionEvent.publicConstruct);

// dropdown
document.querySelector(".banner_dropdown").addEventListener("change", (e) => {
    switch (e.target.value) {
        case "CrimsonEchoes":
            handleConstructionEvent.publicChangeBanner(data.crimsonEchoes);
            break;
        case "Light":
            handleConstructionEvent.publicChangeBanner(data.lightConstruction);
            break;
        case "Heavy":
            handleConstructionEvent.publicChangeBanner(data.heavyConstruction);
            break;
        case "WintersCrownRerun":
            handleConstructionEvent.publicChangeBanner(data.wintersCrownRerun);
            break;
        case "LunarNewYear2019":
            handleConstructionEvent.publicChangeBanner(data.lunarNewYears);
            break;
        case "OppositeColoredRerun":
            handleConstructionEvent.publicChangeBanner(data.oppositeColouredRerun)
            break;
        case "Special":
            handleConstructionEvent.publicChangeBanner(data.specialConstruction);
            break;
        case "EssexAirRaid":
            handleConstructionEvent.publicChangeBanner(data.essexAirRaid);
            break;
        case "StarrySkyArcticFjord":
            handleConstructionEvent.publicChangeBanner(data.arcticFjord);
            break;
        default:
            handleConstructionEvent.publicChangeBanner(data.lightConstruction)
            break;
    }
})
