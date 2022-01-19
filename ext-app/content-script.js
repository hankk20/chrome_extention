console.log("전체받기");
var imgurl = chrome.runtime.getURL(`image/download.svg`);
var saveimg = chrome.runtime.getURL(`image/download2.png`);
var lodingImg = chrome.runtime.getURL(`image/loading.gif`);
var downloadArea = "<div id='downloadArea' style='display: -webkit-inline-box'><a href='javascript:void(0)' id='allDownloadZip' downType='zip' class='btn-btn-btn btn-btn-block btn-down' style='color: #fff;display: -webkit-inline-box;margin-right: 10px;'><i style='content: url("+imgurl+");width:20px;padding: 5px'></i>압축파일 다운로드</a>" +
    "<a href='javascript:void(0)' id='allDownloadA' downType='normal' class='btn-btn-btn btn-btn-block btn-down' style='color: #fff;display: -webkit-inline-box'><i style='content: url("+imgurl+");width:20px;padding: 5px'></i>전체 다운로드</a></div>";
var downlodingArea = "<div id='downloding' style='display: contents'><img src='"+lodingImg+"' style='width: 30px;'></div>"
jQuery("td.AB_tb002Td").append(downloadArea)
jQuery("td.AB_tb002Td").append(downlodingArea)
jQuery("#downloding").hide();

jQuery("#allDownloadA").on("click", allDownloads)
jQuery("#allDownloadZip").on("click", allDownloads)
jQuery(document).on('DOMNodeInserted',function(e){
    var imageLayer = jQuery(e.target)
    if(imageLayer) {
        var imageLayerId = imageLayer.attr("id");
        if (imageLayerId == "ANYBOARDIMAGELAYER") {
            createDonwloadHtml(imageLayer)
        }
    }
});

function createDonwloadHtml(imageLayer){

    imageLayer.append("<div style=\"z-index: 907; position: absolute; top: 10px; right: 135px;\"><img src="+saveimg+" style=\"cursor:pointer;width:40px;padding:8px\" id='imageSingleDownload' ></div>")
    jQuery("#imageSingleDownload").on("click", {layer : imageLayer}, downloadSingle)
}

function downloadSingle(event){
    imgLayer = event.data.layer
    var url = jQuery("#ANYBOARDIMAGETAG").attr("src");
    var link = document.createElement('a');
    link.href = url;
    link.target = '_self';
    link.download = "";
    document.body.append(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

function allDownloads() {
    var type = jQuery(this).attr("downType");
    var burl = location.href;
    var exp = "boardID=(.*?)&";
    var g = burl.match(exp);
    var boardID = g[1];

    var files = [];
    var filenames = [];
    jQuery("div.AB_addFileList a").each(function () {
        var $this = jQuery(this);
        var ahref = $this.attr("href");
        var fileexp = "\(\'(.*)\'\)";
        var fileg = ahref.match(fileexp);
        var filenum = fileg[0];
        var filename = jQuery(jQuery($this).parents().prev()[0]).text();
        filenum = filenum.replaceAll("'", "");
        var file = {};
        file.url = "/core/anyboard/download.php?boardID=" + boardID + "&fileNum=" + filenum;
        file.name = jQuery.trim(filename)
        files.push(file);
    })
    downloding();
    if(type == "zip") {
        compressZip(files);
    }else{
        requestDownloadFile(files);
    }

}

function downloding(){
    jQuery("#downloadArea").hide()
    jQuery("#downloding").show();
    jQuery("#allDownloadA").off();
    jQuery("#allDownloadZip").off();
}
function downloded(){
    jQuery("#downloadArea").show()
    jQuery("#downloding").hide();
    jQuery("#allDownloadA").on("click", allDownloads);
    jQuery("#allDownloadZip").on("click", allDownloads);
}

function compressZip(files) {
    zip = new JSZip();
    count = 0;
    files.forEach(async function(f) {
        var $this = f;
        JSZipUtils.getBinaryContent($this.url, function (err, data) {
            zip.folder("hanyang")
            zip.file($this.name, data, {binary: true});
            count++;
            if (count == files.length) {
                var zipFile = zip.generateAsync({type: "blob"});
                zipFile.then(function (blob) {
                    var link = document.createElement('a');
                    var url = window.URL.createObjectURL(blob);

                    link.href = url;
                    link.target = '_self';
                    link.download = new Date().getTime() + ".zip";
                    document.body.append(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                    downloded();
                })
            }
        })
    });
}

function requestDownloadFile(files) {
    var file = files.shift();
    if(file) {
        var url = file.url;
        $.ajax({
            url: url,
            method: 'POST',
            xhrFields: {
                responseType: 'arraybuffer'
            }
        }).done(function (data, textStatus, jqXhr) {
            if (!data) {
                return;
            }
            try {
                var blob = new Blob([data], {type: jqXhr.getResponseHeader('content-type')});

                var link = document.createElement('a');
                var url = window.URL.createObjectURL(blob);
                link.href = url;
                link.target = '_self';
                if (file.name) link.download = file.name;
                document.body.append(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                requestDownloadFile(files)
            } catch (e) {
                console.error(e)
            }
        });
    }else{
        downloded();
    }
}

