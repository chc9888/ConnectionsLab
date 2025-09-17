let submitButton;
let textInput;

submitButton = document.getElementById('submit_button');
textInput = document.getElementById('name_text');
inputDiv = document.getElementById('input_div');

submitButton.addEventListener("click", function(event){
    event.preventDefault();

    let userText = textInput.value;

    if (userText) {
        if (confirm('Your tormentor will immediately go into the depths of hell ... however when you die, your soul will also belong to hell.'))
            {
                console.log('confirm');
                document.body.style.background = "#d10e00";
                document.body.style.color = "#000000";
                inputDiv.style.display = 'none';                

        } else {
            console.log('cancel');
        }
    }

});
