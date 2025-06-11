document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("playlist-container");
  const modal = document.getElementById("playlist-modal");

  // 1) Load playlists via fetch().then() chaining ---- HIGHLY MODIFIED FOR FEATURED PAGE BC WTH
  fetch("data.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network error: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
        if (document.getElementById("playlist-container")) {
          data.playlists.forEach(createPlaylistTile);
        }
        if (document.getElementById("featured-art")) {
          const playlists = data.playlists;
          const randomIndex = Math.floor(Math.random() * playlists.length);
          const pl = playlists[randomIndex];

          // Update left section
          document.getElementById("featured-art").src = pl.playlist_art;
          document.getElementById("featured-name").textContent = pl.playlist_name;

          // List song names under the playlist
        //   const songNamesUl = document.getElementById("featured-songs");
        //   songNamesUl.innerHTML = "";
        //   pl.songs.forEach((song) => {
        //     const li = document.createElement("li");
        //     li.textContent = song.title;
        //     songNamesUl.appendChild(li);
        //   });

          const songListUl = document.getElementById("featured-song-list");
          songListUl.innerHTML = "";
          pl.songs.forEach((song) => {
            const li = document.createElement("li");
            li.innerHTML = `
          <span class="song-title">${song.title}</span>
          <span class="song-artist">${song.artist}</span>
          <span class="song-duration">${song.duration}</span>
        `;
            songListUl.appendChild(li);
          });
        }
    })
    .catch((err) => {
      console.error("Failed to load playlists:", err);
    });

    if (modal) {
      const closeBtn = modal.querySelector(".close-button");
      const modalArt = document.getElementById("modal-art");
      const modalName = document.getElementById("modal-name");
      const modalAuthor = document.getElementById("modal-author");
      const modalSongs = document.getElementById("modal-songs");

      // 2) Create each card
      function createPlaylistTile(pl) {
        const tile = document.createElement("div");
        tile.className = "playlist-tile";
        tile.innerHTML = `
            <img src="${pl.playlist_art}" alt="${pl.playlist_name}">
            <h3>${pl.playlist_name}</h3>
            <p>By ${pl.playlist_author}</p>
            <span class="heart-icon">&#x2665;</span>
            <span class="like-count">${pl.likes}</span>
          `;

        // open modal when clicking the tile (but not the heart)
        tile.addEventListener("click", (e) => {
          if (!e.target.classList.contains("heart-icon")) {
            openModal(pl);
          }
        });

        // toggle to like/unlike
        const heart = tile.querySelector(".heart-icon");
        const count = tile.querySelector(".like-count");
        heart.addEventListener("click", (e) => {
          e.stopPropagation();
          let n = parseInt(count.textContent, 10);
          if (heart.classList.contains("liked")) {
            heart.classList.remove("liked");
            count.textContent = --n;
          } else {
            heart.classList.add("liked");
            count.textContent = ++n;
          }
        });

        container.appendChild(tile);
      }

      // 3) Populate and show modal
      let originalSongOrder = [];
      function openModal(pl) {
        modalArt.src = pl.playlist_art;
        modalName.textContent = pl.playlist_name;
        modalAuthor.textContent = "By " + pl.playlist_author;
        modalSongs.innerHTML = "";

        originalSongOrder = [...pl.songs];

        pl.songs.forEach((s) => {
          const li = document.createElement("li");
          li.className = "song-item";

          // If song has Spotify ID, create embed
          if (s.spotify_id) {
            li.innerHTML = `
            <div class="song-header">
              <img src="song.png" alt="song cover" class="song-cover" />
              <div class="song-info">
                <p class="song-title">${s.title}</p>
                <p class="song-artist">${s.artist}</p>
              </div>
              <span class="song-duration">${s.duration}</span>
              <button class="expand-btn">
                <span class="expand-icon">▼</span>
              </button>
            </div>
            <div class="spotify-embed-container" style="display: none;">
              <iframe 
                src="https://open.spotify.com/embed/track/${s.spotify_id}?utm_source=generator&theme=0" 
                width="100%" 
                height="152" 
                frameBorder="0" 
                allowfullscreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy">
              </iframe>
            </div>
          `;

            // Add event listener to the expand button
            const expandBtn = li.querySelector(".expand-btn");
            expandBtn.addEventListener("click", function () {
              toggleEmbed(this);
            });
          } else {
            // Fallback for songs without Spotify ID
            li.innerHTML = `
            <div class="song-header">
              <img src="song.png" alt="song cover" class="song-cover" />
              <div class="song-info">
                <p class="song-title">${s.title}</p>
                <p class="song-artist">${s.artist}</p>
              </div>
              <span class="song-duration">${s.duration}</span>
              <span class="no-preview">No preview</span>
            </div>
          `;
          }

          modalSongs.appendChild(li);
        });

        //event listener for shuffle btn
        const shuffleBtn = document.getElementById("shuffleBtn");
        if (shuffleBtn) {
          console.log("shuffleBtn found:", shuffleBtn);
          shuffleBtn.classList.remove("active");
          shuffleBtn.onclick = () => shuffleSongs(pl);
        } else {
          console.log("shuffleBtn not found:", shuffleBtn);
          console.error(
            "Error with shuffle function, crosschek all selectors again"
          );
        }

        modal.classList.add("show");
      }

      // Function to toggle Spotify embed visibility
      function toggleEmbed(button) {
        const container = button
          .closest(".song-item")
          .querySelector(".spotify-embed-container");
        const icon = button.querySelector(".expand-icon");

        if (container.style.display === "none") {
          container.style.display = "block";
          icon.textContent = "▲";
          icon.style.color = "green";
          button.setAttribute("aria-expanded", "true");
        } else {
          container.style.display = "none";
          icon.textContent = "▼";
          icon.style.color = "black";
          button.setAttribute("aria-expanded", "false");
        }
      }

      function shuffleSongs(pl) {
        const shuffleBtn = document.getElementById("shuffleBtn");
        const songsContainer = document.getElementById("modal-songs");

        if (!songsContainer) return;

        if (!shuffleBtn.classList.contains("active")) {
          //for the shuffle
          shuffleBtn.classList.add("active");
          let shuffled = [...originalSongOrder];
          //fisher yates to the rescue
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          renderSongs(shuffled);
        } else {
          shuffleBtn.classList.remove("active");
          renderSongs(originalSongOrder);
        }

        //rendersongs is helping to render the song order in the modal-songs container
        function renderSongs(songsArr) {
          songsContainer.innerHTML = "";
          songsArr.forEach((s) => {
            const li = document.createElement("li");
            li.className = "song-item";

            // If song has Spotify ID, create embed
            if (s.spotify_id) {
              li.innerHTML = `
            <div class="song-header">
              <img src="song.png" alt="song cover" class="song-cover" />
              <div class="song-info">
                <p class="song-title">${s.title}</p>
                <p class="song-artist">${s.artist}</p>
              </div>
              <span class="song-duration">${s.duration}</span>
              <button class="expand-btn">
                <span class="expand-icon">▼</span>
              </button>
            </div>
            <div class="spotify-embed-container" style="display: none;">
              <iframe 
                src="https://open.spotify.com/embed/track/${s.spotify_id}?utm_source=generator&theme=0" 
                width="100%" 
                height="152" 
                frameBorder="0" 
                allowfullscreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy">
              </iframe>
            </div>
          `;

              // Add event listener to the expand button
              const expandBtn = li.querySelector(".expand-btn");
              expandBtn.addEventListener("click", function () {
                toggleEmbed(this);
              });
            } else {
              li.innerHTML = `
            <div class="song-header">
            <img src="song.png" alt="song cover" class="song-cover" />
            <div class="song-info">
            <p class="song-title">${s.title}</p>
            <p class="song-artist">${s.artist}</p>
            </div>
            <span class="song-duration">${s.duration}</span>
            <span class="no-preview">No preview</span>
          </div>
        `;
            }
            songsContainer.appendChild(li);
          });
        }
      }

      // 4) Close handlers
      closeBtn.addEventListener("click", () => {
        modal.classList.remove("show");
      });
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("show");
        }
      });
    }

  
});
