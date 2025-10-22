import express from 'express'

//install and load losdb module
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

const app = express();

//connect to the DB
const defaultData = { coffeTrackerData: [] };
const adapter = new JSONFile('db.json');
const db = new Low(adapter, defaultData);

app.use(express.json());

let coffeTracker = [];

//2. add a route on server, that is listening for a post request
app.post('/noCups', (req, res) => {
    console.log(req.body);
    let obj = {
        coffee: req.body.number
    }
    // add value to the lowdb database
    db.data.coffeTrackerData.push(obj);
    db.write()
        .then(() => {
            res.json({ task: "success" });
        })
})

app.use('/', express.static('public'));
app.listen(5000, () => {
    console.log('listening at localhost:5000');
})

//add route to get all coffee track information
app.get('/getCups', (req, res) => {
    
    //fetch data from the lowdb database
    db.read()
    .then(() =>{
        let obj = {data: db.data.coffeTrackerData}
        res.json(obj);
    })
})