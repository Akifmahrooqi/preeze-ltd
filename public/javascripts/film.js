$(function() {
    // Handler for .ready() called.
    console.log("ready");
});

function formHandler() {
    event.preventDefault();
    retrieveValues()
        .then(function(data) {
            return sendAjaxQuery(data);

        })
        .then(function(data) {
            console.log("second promise" + data);
            $('#theLinks').append(data._id +' '+ data.url +' '+ data.language +' '+ data.description);

        })

}

function retrieveValues() {
    return new Promise((resolve, reject) => {
        var formArray = $("form").serializeArray();
    var data = {};
    for (index in formArray) {
        data[formArray[index].name] = formArray[index].value;
    }
    console.log('onsubmit');
    console.log(data);
    resolve(data);
});
}

function sendAjaxQuery(data) {
    return new Promise((resolve, reject) => {
        console.log("Sending AJAX post");
    $.ajax({
        url: ''+ window.location.href +'/addLink' ,
        data: data,
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
        },
        timeout: 5000
    });
});
}