var foundFilm;

function formHandler() {
    event.preventDefault();
    retrieveValues()
        .then(function (data) {
            return sendAjaxQuery(data);
        })
        .then(function (data) {
            var film = JSON.stringify(data);
            console.log(film.Title);
            // document.getElementById('results').innerHTML= JSON.stringify(data);
            $('#results').html("<div class=\"uk-block uk-block-secondary uk-contrast uk-block-large\">\n" +
                "\n" +
                "            <div class=\"uk-container\">\n" +
                "\n" +
                "                <div class=\"uk-grid uk-grid-match\" data-uk-grid-margin=\"\">\n" +
                "                    <div class=\"uk-width-medium-2-10 uk-row-first\">\n" +
                "                        <div class=\"uk-panel\">\n" +
                "                            <img class=\"uk-thumbnail\" src="+JSON.stringify(data.Poster)+" alt=\"\">\n" +
                "                        </div>\n" +
                "                    </div>\n" +
                "                    <div class=\"uk-width-medium-8-10\">\n" +
                "                        <div class=\"uk-panel\">\n" +
                "                            <h3>"+data.Title+" ("+data.Year.valueOf()+")</h3>\n" +
                "                            <p>"+data.Plot+"</p>\n" +
                // "                            <p><%= films.actors.join(\", \") %></p>\n" +
                // "                            <p><%= films.genre.join(\", \") %></p>\n" +
                "                        </div>\n" +
                "                    </div>\n" +
                "                </div>\n" +
                "\n" +
                "            </div>\n" +
                "\n" +
                "        </div>");
            foundFilm = data;
        });
};

function sendAjaxQuery(data) {
    return new Promise( (resolve, reject) => {
        console.log("Sending AJAX post");
        $.ajax({
            url: 'http://www.omdbapi.com/?apikey=61114d74&t='+data.filmName+'' ,
            type: 'POST',
            success: function (dataR) {
                var ret = dataR;
                // in order to have the object printed by alert
                // we need to JSON stringify the object
                //document.getElementById('results').innerHTML= JSON.stringify(ret);
                console.log(ret);

                resolve(ret);
            },
            error: function (xhr, status, error) {
                console.log('Error: ' + xhr.responseText);
                $("#errors").html(xhr.responseText);
                reject(xhr.responseText);
            }
            // timeout: 5000
        });
    });
}

function retrieveValues() {
    return new Promise( (resolve, reject) => {
        var formArray = $("form").serializeArray();
        var data = {};
        for (index in formArray) {
            data[formArray[index].name] = formArray[index].value;
        }
        console.log('onsubmit');
        console.log(data);
        resolve(data);
    });
};

function sendAjaxQuery2() {
    event.preventDefault();
    return new Promise( (resolve, reject) => {
        console.log("Sending AJAX post");
        $.ajax({
            url: '/addFilm',
            data: foundFilm,
            // dataType: 'application/json',
            type: 'POST',
            success: function (dataR) {
                var ret = dataR;
                // in order to have the object printed by alert
                // we need to JSON stringify the object
                //document.getElementById('results').innerHTML= JSON.stringify(ret);
                console.log(ret);

                resolve(JSON.stringify(ret));
            },
            error: function (xhr, status, error) {
                console.log('Error: ' + xhr.error);
                $("#errors").html(xhr.responseText);
                reject(xhr.responseText);
            }
            // timeout: 5000
        });
    })
    .then(function (data) {
        console.log(data);
    }).catch(e => {
        console.log(e);
    });


};