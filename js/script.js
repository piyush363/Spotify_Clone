console.log("Lets write JavaScript");
let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
  currFolder = folder;

  try {
    // Fetch the explicit list of songs from your new JSON file
    let a = await fetch(`songs/${folder}/info.json`);
    songs = await a.json();
  } catch (error) {
    console.error(
      "Failed to load songs from JSON. Make sure songs.json exists in the folder.",
      error,
    );
    songs = [];
  }

  // Show all the songs in the playlist
  let songUL = document
    .querySelector(".songList")
    .getElementsByTagName("ul")[0];
  songUL.innerHTML = "";

  for (const song of songs) {
    // Cleaning up the display name for the UI
    let cleanName = song.replaceAll("%20", " ").replace(".mp3", "");

    songUL.innerHTML =
      songUL.innerHTML +
      `<li><img class="invert" width="34" src="img/music.svg" alt="">
                            <div class="info">
                                <div>${cleanName}</div>
                                <div>Harry</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="img/play.svg" alt="">
                            </div> </li>`;
  }

  // Attach an event listener to each song item using its index position
  Array.from(
    document.querySelector(".songList").getElementsByTagName("li"),
  ).forEach((e, index) => {
    e.addEventListener("click", () => {
      playMusic(songs[index]);
    });
  });

  return songs;
}
const playMusic = (track, pause = false) => {
  // Changed the leading '/' to '.' to make it relative to the deployment folder
  currentSong.src = `/songs/${currFolder}/` + track;

  if (!pause && track) {
    currentSong.play();
    play.src = "img/pause.svg";
  }

  document.querySelector(".songinfo").innerHTML = track
    ? decodeURI(track).replace(".mp3", "")
    : "";
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
  console.log("displaying albums");

  // 1. Directly list your exact folder names from your songs directory
  let albums = [
    "aashiqui2_songs",
    "bollywood_songs",
    "Chill_mood",
    "Dark_mood",
    "diljit",
    "edsheeran",
    "karan_aujla",
  ];

  let cardContainer = document.querySelector(".cardContainer");

  // Clear static container before appending dynamic data
  cardContainer.innerHTML = "";

  // 2. Loop through the list of folders directly
  for (let index = 0; index < albums.length; index++) {
    const folder = albums[index];
    console.log("Processing Album Folder:", folder);

    try {
      // Get the metadata of the folder
      let infoFetch = await fetch(`./songs/${folder}/info.json`);
      let response = await infoFetch.json();

      cardContainer.innerHTML =
        cardContainer.innerHTML +
        ` <div data-folder="${folder}" class="card">
                <div class="play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                            stroke-linejoin="round" />
                    </svg>
                </div>
                <img src="./songs/${folder}/cover.jpg" alt="${response.title}">
                <h2>${response.title}</h2>
                <p>${response.description}</p>
            </div>`;
    } catch (err) {
      console.log("Error loading album info for:", folder, err);
    }
  }

  // Load the playlist whenever card is clicked
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      console.log("Fetching Songs");
      songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
      playMusic(songs[0]);
    });
  });
}

async function main() {
  // 1. Get initial default list of songs
  await getSongs("songs/diljit"); // Set your default directory folder name here
  playMusic(songs[0], true);

  // 2. Display all your custom albums dynamically on the page
  await displayAlbums();

  // Attach an event listener to play, next and previous
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "img/pause.svg";
    } else {
      currentSong.pause();
      play.src = "img/play.svg";
    }
  });

  // Listen for timeupdate event
  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML =
      `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  // Add an event listener to seekbar
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  // Add an event listener for hamburger
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  // Add an event listener for close button
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  // Add an event listener to previous
  previous.addEventListener("click", () => {
    currentSong.pause();
    console.log("Previous clicked");
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index - 1 >= 0) {
      playMusic(songs[index - 1]);
    }
  });

  // Add an event listener to next
  next.addEventListener("click", () => {
    currentSong.pause();
    console.log("Next clicked");
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    }
  });

  // Add an event to volume
  document
    .querySelector(".range")
    .getElementsByTagName("input")[0]
    .addEventListener("change", (e) => {
      console.log("Setting volume to", e.target.value, "/ 100");
      currentSong.volume = parseInt(e.target.value) / 100;
      if (currentSong.volume > 0) {
        document.querySelector(".volume>img").src = document
          .querySelector(".volume>img")
          .src.replace("mute.svg", "volume.svg");
      }
    });

  // Add event listener to mute the track
  document.querySelector(".volume>img").addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentSong.volume = 0;
      document.querySelector(".range").getElementsByTagName("input")[0].value =
        0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentSong.volume = 0.1;
      document.querySelector(".range").getElementsByTagName("input")[0].value =
        10;
    }
  });
}

main();
