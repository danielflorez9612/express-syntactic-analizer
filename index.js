const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser= require('body-parser');

// Tables
const tables = {
    words : 'words'
};

const path = require('path');
const PORT = process.env.PORT || 5000;
const app = express();
app .use(express.static(path.join(__dirname, 'public')))
    .use(bodyParser.urlencoded({extended: true}))
    .use(bodyParser.json())
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs');
// mongodb connection
MongoClient.connect('mongodb://root:dev96@ds119650.mlab.com:19650/words-dictionary', (err, client) => {
    if (err) return console.log(err);
    db = client.db('words-dictionary');
    app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
});


////////////////////////////////////////////////
//  ROUTES
////////////////////////////////////////////////
const SUBJECT = 'subject';
const VERB = 'verb';
const ADVERB = 'adverb';
const NOUN = 'noun';
const ARTICLE = 'article';
const ADJECTIVE = 'article';
const COMPOSED_NOUN = [ARTICLE,NOUN];
function flattened(arr) {
    return arr.reduce((acc,val) => acc.concat(val),[]);
}
const structures = [
    [SUBJECT],
    [COMPOSED_NOUN],
    [SUBJECT,VERB],
    flattened([COMPOSED_NOUN,VERB]),
    [SUBJECT,VERB,ADJECTIVE],
    flattened([COMPOSED_NOUN,VERB,ADJECTIVE]),
    [SUBJECT,VERB,ADVERB],
    flattened([COMPOSED_NOUN,VERB,ADVERB]),
    [SUBJECT,VERB,SUBJECT],
    flattened([COMPOSED_NOUN,VERB,SUBJECT]),
    flattened([SUBJECT,VERB,COMPOSED_NOUN]),
    flattened([COMPOSED_NOUN,VERB,COMPOSED_NOUN])
];

function checkPhraseWithWords(phrase, objects) {
    const phraseParts = phrase.split(' ')
        .map(value => {
            const found =objects.find(value1 => value1.word.toLowerCase().trim()===value.toLowerCase().trim());
            return found?found.type:'n/a';
        }).join('');
    return  structures.find(structure => structure.join('')===phraseParts)!==undefined;
}

// GET /
app.get('/', (request, response) => {
    db.collection(tables.words).find().toArray((err, objects) => {
        // renders index.ejs
        response.render('pages/index', {words: objects, result:''})
    });
});
app.post('/', (request, response) => {
    db.collection(tables.words).find().toArray((err, objects) => {
        if (err) return console.log(err);
        const result = checkPhraseWithWords(request.body.phrase, objects);
        console.log(result);
        // renders index.ejs
        response.render('index.ejs', {words: objects, result:result})
    });
});
// POST /words
app.post('/words', (req, res) => {
    db.collection(tables.words).save(req.body, err => {
        if (err) return console.log(err);
        console.log('saved to database');
        res.redirect('/');
    })
});
// PUT /words
// app.put('/words', (req, res) => {
//     db.collection(tables.words)
//         .findOneAndUpdate({word:'run'}, {
//             $set: {
//                 word: req.body.word,
//                 type: req.body.type
//             }
//         }, {
//             sort: {_id: -1},
//             upsert: true
//         }, (err, result) => {
//             if (err) return res.send(err);
//             res.send(result)
//         })
// });
// DELETE /words
app.post('/delete', (req, res) => {
    db.collection(tables.words).findOneAndDelete({word: req.body.wordDelete},
        err => {
            if (err) return res.send(500, err);
            res.redirect('/');
        })
});