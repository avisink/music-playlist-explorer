let allPlaylists = [];

// Function to load a random playlist (for featured page)
function loadRandomPlaylist() {
  if (allPlaylists.length === 0) return;
  
  // Generate random index
  const randomIndex = Math.floor(Math.random() * allPlaylists.length);
  const playlist = allPlaylists[randomIndex];
  
  // Update the featured playlist display
  const featuredArt = document.getElementById("featured-art");
  const featuredName = document.getElementById("featured-name");
  const songListUl = document.getElementById("featured-song-list");
  
  if (featuredArt && featuredName && songListUl) {
    featuredArt.src = playlist.playlist_art;
    featuredName.textContent = playlist.playlist_name;
    
    // Update the song list
    songListUl.innerHTML = "";
    
    playlist.songs.forEach((song) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="song-title">${song.title}</span>
        <span class="song-artist">${song.artist}</span>
        <span class="song-duration">${song.duration}</span>
      `;
      songListUl.appendChild(li);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("playlist-container");
  const modal = document.getElementById("playlist-modal");

  // 1) Load playlists via fetch().then() chaining
  fetch("data.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network error: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
        allPlaylists = data.playlists;
        
        // Handle main playlist page
        if (container) {
          data.playlists.forEach(createPlaylistTile);
        }
        
        // Handle featured page
        if (document.getElementById("featured-art")) {
          loadRandomPlaylist();
        }
    })
    .catch((err) => {
      console.error("Failed to load playlists:", err);
      console.log("Using sample data instead");
      
      // Fallback to sample data
      allPlaylists = sampleData.playlists;
      
      // Handle main playlist page with sample data
      if (container) {
        sampleData.playlists.forEach(createPlaylistTile);
      }
      
      // Handle featured page with sample data
      if (document.getElementById("featured-art")) {
        loadRandomPlaylist();
      }
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
            <span class="heart-icon" role="button" aria-label="like">🤍</span>
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
            heart.textContent="🤍";
            count.textContent = --n;
          } else {
            heart.classList.add("liked");
            heart.textContent = "💚";
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

// Load new playlist when the page becomes visible (for navigation back to featured page)
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && document.getElementById("featured-art")) {
    // Small delay to ensure it feels like a new selection
    setTimeout(() => {
      loadRandomPlaylist();
    }, 100);
  }
});