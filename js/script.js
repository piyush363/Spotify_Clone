console.log("Lets write JavaScript");
let currentSong = new Audio();
let songs = [];
let currFolder = "";

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

async function getSongs(folderName) {
  // Always update currFolder FIRST so playMusic knows where to look
  currFolder = folderName;

  try {
    let a = await fetch(`/songs/${folderName}/songs.json`);
    songs = await a.json();
  } catch (error) {
    console.error(`Failed to load songs from /songs/${folderName}/songs.json`, error);
    songs = [];
  }

  let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
  songUL.innerHTML = "";

  for (const song of songs) {
    let cleanName = decodeURIComponent(song).replaceAll("%20", " ").replace(".mp3", "");

    songUL.innerHTML += `<li>
      <img class="invert" width="34" src="img/music.svg" alt="">
      <div class="info">
          <div>${cleanName}</div>
          <div>Harry</div>
      </div>
      <div class="playnow">
          <span>Play Now</span>
          <img class="invert" src="img/play.svg" alt="">
      </div>
    </li>`;
  }

  // Attach event listeners dynamically to current song list
  Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach((e, index) => {
    e.addEventListener("click", () => {
      playMusic(songs[index]);
    });
  });

  return songs;
}

const playMusic = async (track, pause = false) => {
  if (!track) return;

  try {
    // 1. Pause and completely reset current audio element stream
    currentSong.pause();
    currentSong.currentTime = 0;

    // 2. Set new URL and force the browser to reload audio buffer
    currentSong.src = `/songs/${currFolder}/` + track;
    currentSong.load();

    // 3. Update the UI text
    let cleanDisplayName = decodeURIComponent(track).replace(".mp3", "");
    document.querySelector(".songinfo").innerHTML = cleanDisplayName;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    // 4. Play the track safely with async handling
    if (!pause) {
      let playPromise = currentSong.play();
      if (playPromise !== undefined) {
        await playPromise;
        play.src = "img/pause.svg";
      }
    } else {
      play.src = "img/play.svg";
    }
  } catch (err) {
    console.error("Playback error when switching track:", err);
    play.src = "img/play.svg";
  }
};

async function displayAlbums() {
  console.log("displaying albums");

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
  cardContainer.innerHTML = "";

  for (let index = 0; index < albums.length; index++) {
    const folder = albums[index];

    try {
      let infoFetch = await fetch(`/songs/${folder}/info.json`);
      let response = await infoFetch.json();

      cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
            <div class="play">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                        stroke-linejoin="round" />
                </svg>
            </div>
            <img src="/songs/${folder}/cover.jpg" alt="${response.title}">
            <h2>${response.title}</h2>
            <p>${response.description}</p>
        </div>`;
    } catch (err) {
      console.log("Error loading album info for:", folder, err);
    }
  }

  // Click on Album Card to load that playlist & play first song
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      const folder = item.currentTarget.dataset.folder;
      
      // Fetch songs for new folder & play first song cleanly
      let fetchedSongs = await getSongs(folder);
      if (fetchedSongs && fetchedSongs.length > 0) {
        await playMusic(fetchedSongs[0]);
      }
    });
  });
}

async function main() {
  // Load default album on start
  await getSongs("diljit");
  if (songs.length > 0) {
    playMusic(songs[0], true); // Load first song paused
  }

  await displayAlbums();

  // Play / Pause toggle
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "img/pause.svg";
    } else {
      currentSong.pause();
      play.src = "img/play.svg";
    }
  });

  // Seekbar & Time updates
  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(
      currentSong.currentTime
    )} / ${secondsToMinutesSeconds(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  // UI Hamburger controls
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  // Previous Song Button
  previous.addEventListener("click", () => {
    currentSong.pause();
    let currentFileName = decodeURIComponent(currentSong.src.split("/").pop());
    let index = songs.findIndex((s) => decodeURIComponent(s) === currentFileName);

    if (index - 1 >= 0) {
      playMusic(songs[index - 1]);
    }
  });

  // Next Song Button
  next.addEventListener("click", () => {
    currentSong.pause();
    let currentFileName = decodeURIComponent(currentSong.src.split("/").pop());
    let index = songs.findIndex((s) => decodeURIComponent(s) === currentFileName);

    if (index !== -1 && index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    }
  });

  // Volume bar
  document
    .querySelector(".range")
    .getElementsByTagName("input")[0]
    .addEventListener("change", (e) => {
      currentSong.volume = parseInt(e.target.value) / 100;
      if (currentSong.volume > 0) {
        document.querySelector(".volume>img").src = document
          .querySelector(".volume>img")
          .src.replace("mute.svg", "volume.svg");
      }
    });

  // Mute / Unmute
  document.querySelector(".volume>img").addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentSong.volume = 0;
      document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentSong.volume = 0.1;
      document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
    }
  });
}

main();
