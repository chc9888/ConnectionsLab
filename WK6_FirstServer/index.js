let express = require('express');
let app = express();

let books = {
    "data" : [
        {
            name: "Dracula",
            author: "Bram Stroker",
            info: "Jonathan Harker’s terrifying encounter with Count Dracula, a Transylvanian vampire who seeks to spread his curse to England, unfolds through letters and diaries. The story explores fear, sexuality, and the tension between modern science and ancient superstition, defining gothic horror for generations."
        },
        {
            name: "The lady of the shroud",
            author: "Bram Stroker",
            info: "A young heir, Rupert Sent Leger, inherits a Balkan estate and meets a mysterious veiled woman emerging from a shroud. Caught between superstition and politics, he uncovers secrets of love, identity, and nationhood in a gothic world where the dead may walk again."
        },
        {
            name: "In a glass darkly",
            author: "Sheridan Le Fanu",
            info: "A collection of eerie case studies by Dr. Hesselius, a psychic investigator, examines encounters with madness, ghosts, and vampires. Through stories like Carmilla, it blurs the line between science and the supernatural, pioneering psychological horror and exploring human fear and desire."
        },
        {
            name: "Uncle Silas",
            author: "Sheridan Le Fanu",
            info: "Maud Ruthyn, a young heiress, is sent to live with her sinister uncle after her father’s death. Surrounded by secrecy, manipulation, and deceit, she faces growing peril in a Victorian world of gothic suspense where innocence and inheritance invite danger."
        },
        {
            name: "Frankenstein",
            author: "Mary Shelley",
            info: "Victor Frankenstein, an ambitious scientist, creates life from death but recoils from his monstrous creation. As both creator and creature suffer isolation and guilt, the story questions the boundaries of human ambition, morality, and the cost of defying nature."
        },
        {
            name: "Mathilda",
            author: "Mary Shelley",
            info: "A young woman recounts her tragic life marked by her father’s forbidden love and her own descent into grief and solitude. Through her confessions, themes of loss, guilt, and alienation unfold with haunting emotional depth and poetic melancholy."
        },
        {
            name: "The golden Bug",
            author: "Edgar Allan Poe",
            info: "William Legrand becomes obsessed with a mysterious golden beetle that leads him to a hidden pirate treasure. Combining cryptography, adventure, and psychological tension, the story showcases logic and obsession in Poe’s early model of detective fiction."
        },
        {
            name: "The murders in the rue Morgue",
            author: "Edgar Allan Poe",
            info: "Detective C. Auguste Dupin uses keen reasoning to solve a brutal double murder in Paris. Blending logic and horror, the story examines the power of deduction and observation, laying the groundwork for modern detective fiction."
        },
        {
            name: "Woorms of the earth",
            author: "Robert E. Howard",
            info: "Bran Mak Morn, a Pictish king, allies with ancient subterranean beings to take revenge on Rome. His dark pact reveals the cost of vengeance and the horror of awakening ancient powers buried beneath human civilization."
        },
        {
            name: "The feather pillow",
            author: "Oracio Quiroga",
            info: "A newlywed grows mysteriously ill as a monstrous parasite hides within her pillow, feeding unseen each night. This brief but chilling tale of domestic horror exposes the fragility of life and the grotesque lurking in the familiar."
        }
        
    ]
}

app.use('/', express.static('public'));

app.get('/books',(request, response) =>{
    response.json(books);
})

app.get('/books/:book',(request, response) =>{
    console.log(request.params.book);
    let user_book = request.params.book;
    let user_obj;
    for (let i=0;i<books.data.length;i++){
        if(user_book == books.data[i].name){
            user_obj = books.data[i];
        }
    }
    console.log(user_obj);
    if(user_obj){
        response.json(user_obj);
    } else {
        response.json({status: "info nos present"})
    }
})

app.listen(3000, ()=>{
    console.log("app is listening at localhost:3000")
})