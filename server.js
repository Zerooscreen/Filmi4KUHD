const express = require('express');
const { tmdb } = require('./tmdb'); // sesuaikan dengan path file tmdb Anda
const { 
  head, 
  layout, 
  posterCard, 
  genreRow, 
  trailerBlock, 
  castGrid, 
  similarSection, 
  watchButton, 
  escapeHtml 
} = require('./lib/render'); // sesuaikan path render.js Anda

const app = express();

app.use(express.static('public'));

// 1. ROUTE DETAIL FILM (Menampilkan Tombol Watch, Trailer, Cast, dan Similar)
app.get('/movie/:id/:slug?', async (req, res) => {
  try {
    const movieId = req.params.id;
    
    // WAJIB ADA: append_to_response agar data trailer, aktor & similar ikut terambil
    const movie = await tmdb(`/movie/${movieId}`, {
      append_to_response: 'credits,videos,similar'
    });

    const html = layout({
      headHtml: head({
        title: movie.title,
        description: movie.overview,
        url: `https://${req.get('host')}${req.originalUrl}`
      }),
      bodyHtml: `
        <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
          <!-- Detail Utama -->
          <div class="detail-hero">
            <div class="detail-poster">
              <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${escapeHtml(movie.title)}">
            </div>
            <div class="detail-info">
              <h1 class="detail-title">${escapeHtml(movie.title)}</h1>
              <p class="tagline">${escapeHtml(movie.tagline || '')}</p>
              <div class="detail-overview">
                <h2>Резюме</h2>
                <p>${escapeHtml(movie.overview)}</p>
              </div>
              
              <!-- TOMBOL WATCH YANG DIMINTA -->
              ${watchButton()}
            </div>
          </div>

          <!-- TRAILER VIDEO -->
          <div class="section-block">
            <h3>Трейлър</h3>
            ${trailerBlock(movie.videos)}
          </div>

          <!-- AKTOR / CAST -->
          <div class="section-block">
            <h3>Актьорски състав</h3>
            ${castGrid(movie.credits)}
          </div>

          <!-- SIMILAR MOVIES (FILM SERUPA) -->
          ${similarSection(movie.similar)}
        </div>
      `,
      activeTab: 'movie'
    });

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(404).send('Филмът не е намерен');
  }
});

// 2. ROUTE SEARCH (Mengatasi Error Cannot GET /search saat Klik Aktor)
app.get('/search', async (req, res) => {
  const query = req.query.q || '';
  try {
    const data = await tmdb('/search/multi', { query });
    const results = data.results || [];

    const bodyHtml = `
      <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #fff; margin-bottom: 20px;">Резултати от търсенето за: "${escapeHtml(query)}"</h2>
        <div class="grid">
          ${results.map(item => posterCard(item, item.media_type || 'movie')).join('')}
        </div>
      </div>
    `;

    res.send(layout({
      headHtml: head({ title: `Търсене: ${query}` }),
      bodyHtml,
      activeTab: 'movie'
    }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Грешка при търсене');
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`CineBox (BG) работи на: http://localhost:${PORT}`);
});
