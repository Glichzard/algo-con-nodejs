const sites = document.getElementById("sites")
const btn = document.getElementById("searchPlaces")
const statusTxt = document.getElementById("status")

var tmpMarker
var markerHistory = []

const showHistoryChk = document.getElementById("showHistory")

btn.addEventListener("click", async () => {
    const coords = document.getElementById("coords").value || "-34.9055016, -56.1851147"
    const coordX = coords.split(",")[0] || ""
    const coordY = coords.split(",")[1] || ""
    const radius = document.getElementById("radius").value || 500
    const type = document.getElementById("types").value
    statusTxt.innerText = "Cargando"

    let response
    response = await fetch(`http://127.0.0.1:3500/api/places?x=${coordX}&y=${coordY}&radius=${radius}&type=${type}`)

    // const response = await fetch(`http://localhost:3500/api/places?x=${coordX}&y=${coordY}&radius=${radius}&type=${type}`)
    const jsonData = await response.json()

    statusTxt.innerText = "Listo. " + jsonData.length + " resultados"

    sites.innerHTML = ""
    jsonData.forEach((place) => {
        const myDiv = document.createElement("div")
        const placeNameHTML = document.createElement("span")
        const myLink = document.createElement("a")
        const openMap = document.createElement("a")
        const phoneText = document.createElement("span")
        const listType = document.createElement("ul")

        placeNameHTML.innerText = place.name
        myDiv.appendChild(placeNameHTML)

        place.types.forEach((e) => {
            if (e === "point_of_interest" || e === "establishment") {
                return
            }
            const type = document.createElement("li")
            type.innerText = e
            listType.appendChild(type)
        })
        myDiv.appendChild(listType)

        openMap.href = `http://www.google.com/maps/place/${place.coords.x},${place.coords.y}`
        openMap.innerText = place.address
        openMap.target = "_blank"
        myDiv.appendChild(openMap)

        phoneText.innerText = place.phone || "No esta registrado un numero de telefono"
        myDiv.appendChild(phoneText)

        !place.website || (myLink.href = place.website)
        myLink.innerText = place.website || 'No tiene pagina'
        myLink.target = "_blank"
        myDiv.appendChild(myLink)

        sites.appendChild(myDiv)
    })

    saveHistory(coords, radius)
    loadHistory()
    listHistory()
})

const temporalyArea = (lat, lng) => {
    const radius = parseInt(document.getElementById("radius").value)
    tmpMarker = new google.maps.Circle({
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        map,
        center: { lat, lng },
        radius: radius || 500
    })

    document.getElementById("coords").value = `${lat}, ${lng}`
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(initMap);
    } else {
        alert('Tu navegador no soporta la geolocalización.');
    }
}

function initMap(position) {
    const center = {
        lat: position != undefined ? position.coords.latitude : -34.9055016,
        lng: position != undefined ? position.coords.longitude : -56.1851147
    }

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center,
        styles: [
            {
                featureType: 'poi',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'transit',
                elementType: 'labels.icon',
                stylers: [{ visibility: 'off' }]
            }
        ]
    })

    map.addListener('click', function (event) {
        const clickedCoordinates = event.latLng

        const getLat = parseFloat(clickedCoordinates.lat().toFixed(6))
        const getLng = parseFloat(clickedCoordinates.lng().toFixed(6))

        if (tmpMarker != undefined) {
            tmpMarker.setMap(null)
        }
        temporalyArea(getLat, getLng)
    })

    loadHistory()
}


async function loadHistory() {
    const response = await fetch(`http://127.0.0.1:3500/api/history`)
    // const response = await fetch(`http://192.168.33.56:3500/api/history`)
    const jsonData = await response.json()

    for (var i = 0; i < markerHistory.length; i++) {
        markerHistory[i].setMap(null);
    }
    markerHistory = []

    jsonData.forEach((e) => {
        const center = {
            lat: parseFloat(e.coords.split(",")[0]),
            lng: parseFloat(e.coords.split(",")[1])
        }
        const circle = new google.maps.Circle({
            strokeColor: '#00FF00',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#00FF00',
            fillOpacity: 0.35,
            map,
            center,
            radius: parseInt(e.radius)
        });

        markerHistory.push(circle);
    })
}


async function saveHistory(coords, radius) {
    await fetch(`http://127.0.0.1:3500/api/saveHistory?coords=${coords}&radius=${radius}`)
    // await fetch(`http://192.168.33.56:3500/api/saveHistory?coords=${coords}&radius=${radius}`)
    loadHistory()
}

showHistoryChk.addEventListener("change", () => {
    loadHistory()
})

document.getElementById("clearHistory").addEventListener("click", () => {
    fetch("http://127.0.0.1:3500/api/clearHistory")
    // fetch("http://192.168.33.56:3500/api/clearHistory")
    loadHistory()
})

window.onload = () => {
    getLocation()
}

const listHistory = async () => {
    document.getElementById("map").classList.toggle("shownHistory")
    document.getElementById("historyList").classList.toggle("show")

    const response = await fetch(`http://127.0.0.1:3500/api/history`)
    const jsonData = await response.json()

    document.getElementById("historyList").innerHTML = ""

    jsonData.forEach(e => {
        const myDiv = document.createElement("div")

        const coords = document.createElement("button")
        coords.innerText = e.coords

        coords.addEventListener("click", () => {
            const center = {
                lat: parseFloat(e.coords.split(",")[0]),
                lng: parseFloat(e.coords.split(",")[1])
            }
            map.setCenter(center);

        })

        myDiv.appendChild(coords)

        document.getElementById("historyList").appendChild(myDiv)
    });
}

document.getElementById("viewHistory").addEventListener("click", () => listHistory())