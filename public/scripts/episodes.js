
export async function createEpisodesList(episodes) {
  const episodeContainer = document.getElementById(`episodes-list-container`);
  if (!episodeContainer) return;

  // Clear existing content
  episodeContainer.innerHTML = '';

  episodes.forEach(episode => {
    const li = document.createElement('li');
    li.className = 'ep-list-ite';
    li.innerHTML = `
      <h6>S${episode.season} E${episode.episodeNumber}</h6>
      <h5>${episode.title}</h5>
      <p rawHTML=${episode.description.slice(0, 100)}>...</p>`;
    episodeContainer.appendChild(li);
  });
}



