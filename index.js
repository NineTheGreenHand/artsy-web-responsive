const axios = require('axios');
const express = require('express');
const cors = require('cors');

// Get the Artsy API Token:
function get_token() {
   const post_url = 'https://api.artsy.net/api/tokens/xapp_token';
   return axios({
      url: post_url,
      method: 'post',
      params: {
         'client_id' : '5b60a14d160f9083f4e3',
         'client_secret' : '3a8b6de35a1f4fdca93189129f8d3f22'
      }
   }).then((response) => {
      // console.log(response.data.token);
      return response.data.token;
   })
}

// Get the artist name, id, and picture url address for user input:
function get_id_name_picURL(input) {
   const search_url = 'https://api.artsy.net/api/search';
   let ret = get_token();
   return ret.then(function(token) {
      return axios({
         url: search_url,
         method: 'get',
         params: {
            'q' : input, 
            'size' : '10'
         },
         headers: {
            'X-XAPP-Token' : token
         }
      }).then(function(response) {
         let search_result = response.data._embedded.results;
         // need to filter the search_result with only 'og_type' is 'artist':
         search_result = search_result.filter(function(result) {
            return result.og_type == 'artist';
         })
         var artists = [];
         var arrLen = search_result.length;
         for (let i = 0; i < arrLen; ++i) {
            var id = search_result[i]._links.self.href.split('https://api.artsy.net/api/artists/')[1];
            var name = search_result[i].title;
            var picURL = search_result[i]._links.thumbnail.href;
            if (picURL == "/assets/shared/missing_image.png") {
               picURL = "./assets/images/artsy_logo.svg";
            }
            var artist = {'name' : name, 'id' : id, 'picURL' : picURL};
            artists.push(artist);
         }
         return artists;
      })
   })
}

// Gets the artist name, birthday, deathday, and biography depend on the artist id:
function get_bio(artist_id) {
   const search_url = 'https://api.artsy.net/api/artists/' + artist_id;
   let ret = get_token();
   return ret.then(function(token) {
      return axios({
         url: search_url,
         method: 'get',
         headers: {
            'X-XAPP-Token' : token
         }
      }).then(function(response) {
         let search_result = response.data;
         var bio = {'name' : search_result.name, 'birthday' : search_result.birthday,
                  'deathday': search_result.deathday, 'nationality' : search_result.nationality,
                  'bio' : search_result.biography};
         return bio;
      })
   })
}

// Get artworks of a artist with a given artist id:
function get_artwork(artist_id) {
   const search_url = 'https://api.artsy.net/api/artworks';
   let ret = get_token();
   return ret.then(function(token) {
      return axios({
         url: search_url,
         method: 'get',
         params: {
            'artist_id': artist_id,
            'size': '10'
         },
         headers: {
            'X-XAPP-Token' : token
         }
      }).then(function(response) {
         let search_result = response.data._embedded.artworks;
         var artworks = [];
         var arrLen = search_result.length;
         for (let i = 0; i < arrLen; ++i) {
            var artwork_id = search_result[i].id;
            var artwork_name = search_result[i].title;
            var artwork_date = search_result[i].date;
            var artwork_picURL = search_result[i]._links.thumbnail.href;
            var artwork = {'artwork_id' : artwork_id, 'artwork_name' : artwork_name, 
                           'artwork_date' : artwork_date, 'artwork_picURL' : artwork_picURL};
            artworks.push(artwork);
         }
         return artworks;
      })
   })
}

// Get gene of a artwork with a given artwork id:
function get_gene(artwork_id) {
   const search_url = 'https://api.artsy.net/api/genes';
   let ret = get_token();
   return ret.then(function(token) {
      return axios({
         url: search_url,
         method: 'get',
         params: {
            'artwork_id' : artwork_id
         },
         headers: {
            'X-XAPP-Token' : token
         }
      }).then(function(response) {
         let search_result = response.data._embedded.genes;
         var genes = [];
         var arrLen = search_result.length;
         for (let i = 0; i < arrLen; ++i) {
            var gene_name = search_result[i].name;
            var gene_picURL = search_result[i]._links.thumbnail.href;
            var gene = {'gene_name' : gene_name, 'gene_picURL' : gene_picURL};
            genes.push(gene);
         }
         return genes;
      })
   })
}

const app = express();
app.use(cors());
const port = parseInt(process.env.PORT) || 5000;

app.use(express.static('frontend'));

// This is the front-end main page:
app.get('/', (req, res) => {
   res.send('./frontend/index.html');
})

// Backend for artists with the userInput:
app.get('/centaurus/artist_list/:userInput', (req, res) => {
   let artists = get_id_name_picURL(req.params.userInput);
   artists.then(function(result) {
      res.send(result);
   })
})

// Backend for artist biography information with the artist id:
app.get('/centaurus/artist_info/:artist_id', (req, res) => {
   let artist_info = get_bio(req.params.artist_id);
   artist_info.then(function(result) {
      res.send(result);
   })
})

// Backend for artist's artworks' information with the artist id:
app.get('/centaurus/artwork_list/:artist_id', (req, res) => {
   let artworks = get_artwork(req.params.artist_id);
   artworks.then(function(result) {
      res.send(result);
   })
})

// Backend for artwork genes' information with the artwork id:
app.get('/centaurus/gene/:artwork_id', (req, res) => {
   let gene = get_gene(req.params.artwork_id);
   gene.then(function(result) {
      res.send(result);
   })
})

app.listen(port, () => {
   console.log(`Example app listening on port ${port}`);
})