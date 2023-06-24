
let SPREADSHEET_ID = "18Zt-EY1HikdgJTkp34FbVkxhBuRTleBy3gau63FvI_I";
let TAB_NAME = "Sheet1";
let INFO_TAB = "Sheet2";

$(document).ready(function () {
    $.getJSON("https://opensheet.elk.sh/" + SPREADSHEET_ID + "/" + TAB_NAME, function (data) {
        for (let i = data.length - 1; i >= 0; i--) {
            let entry = data[i];
            let link="";

            if (entry.link) {
                console.log("LINK")
                link = `<a href="${entry.link}" target="_blank">📎</a>`
            }

            if (!entry.private) {
                $(`<div class="entry"> 
                        <div class="tweet">` + entry.thought + `</div> 
                        <div class="date">` + link + ` ` + entry.date + `</div> 
                    </div>`)
                    .appendTo("#table");
            }
        }
    });

    $.getJSON("https://opensheet.elk.sh/" + SPREADSHEET_ID + "/" + INFO_TAB, function (data) {

        let entry = data[0];

        $(`<div class="status"> <b><a href="https://www.aliciaguo.com/" target="_blank">alicia</a></b> is ` + entry.status + `
                    </div><br>`)
            .appendTo("#status");

        $(`<div class="mood"> <b>mood</b>: ` + entry.mood + `
                    </div>`)
            .appendTo("#status");

        $(`<div class="nugget"> <b>in the oven</b>: ` + entry.nugget + `
                    </div>`)
            .appendTo("#nugget");

        $(`<div class="note"> <b>note</b>: ` + entry.note + `
                    </div>`)
            .appendTo("#note");


    });
});



// thank you https://github.com/benborgers/opensheet