if (typeof console === undefined) console = {log:function(){}};

var ytPlayer,
    vPlayer,
    vidIndex = 0,
    isOn = false,
    videoPlaylist = [],
    ytPlayerContainer = $('#yt-player-contain').hide(),
    vPlayerContainer = $('#v-player-contain').hide(),
    autoHideTimer,
    dashIsHidden;

// default key/tag mappings for playlist control
var keyMapping = {
    65:'art',           // a
    83:'science',       // s
    68:'art,science'   // d
};

function onYouTubeIframeAPIReady() {
    console.log('onYouTubeIframeAPIReady');
    ytPlayer = new YT.Player('yt-player-contain', {
        height: '100%',
        width: '100%',
        playerVars: {
            controls:0,
            showinfo:0
        },
        events: {
            'onReady': onYTPlayerReady,
            'onStateChange': onYTPlayerStateChange
        }
    });
}

function startChannel() {
    console.log('startChannel');
    isOn = true;
    $('#playlist-view').addClass('hide');
    $('#channel-view').removeClass('hide');
    $('body').addClass('channel-active');
    playVideo();
}

function stopChannel(startIndex) {
    isOn = false;
    window.location = './';
}

function playVideo() {
    console.log('playVideo');
    // get video data
    var videoData = videoPlaylist[vidIndex];
    var service = videoData.service;
    var id = videoData.id;
    var title = videoData.title;

    console.log('playVideo '+service+' '+id);

    // update player with new video
    if (service === 'youtube') {

        // hide vimeo
        vPlayerContainer.hide().empty();

        // show/load/play video
        console.log('service = youtube');
        $('#yt-player-contain').show();
        if (ytPlayer.loadVideoById) {
            ytPlayer.loadVideoById(id);
        }
    }
    else if (service === 'vimeo') {
        console.log('service = vimeo');
        // hide youtube
        $('#yt-player-contain').hide();

        // show/load/play vimeo
        vPlayerContainer.show().html('<iframe id="v-player" src="http://player.vimeo.com/video/'+id+'?api=1&player_id=v-player&autoplay=1&title=0&byline=0&portrait=0&api=1" width="100%" height="100%" frameborder="0" webkitallowfullscreen allowfullscreen></iframe>');

        vPlayer = document.getElementById('v-player');
        var isPlaying = false;
        $f(vPlayer).addEvent('ready', function(playerID) {
            console.log('vimeo event ready');
            vPlayer = $f(playerID);
            vPlayer.addEvent('playProgress', function(playerID) {
                if (!isPlaying) {
                    console.log('vimeo playProgress set isPlaying = true');
                    isPlaying = true;
                }
            });
            vPlayer.addEvent('finish', onVideoFinish);
        });

        setTimeout(function() {
            if (!isPlaying && videoPlaylist[vidIndex].service === 'vimeo') {
                onPlayError('Could not play video, Vimeo ID:'+id);
            }
        }, 10000);
    }
    // if service not supported error
    else {
        onPlayError('Video service "'+service+'" not recognized');
    }
    updateDashboard();
}

function onPlayError(msg) {
    console.log('onPlayError');
    // throw error and try next video
    onVideoFinish();
    throw new Error(msg);
}

function updateDashboard() {
    console.log('updateDashboard');
    $('#now-playing-title').text(videoPlaylist[vidIndex].title);
    $('#channel-dashboard')
        .removeClass('transparent');

    enableAutoHide(false);
    autoHideTimer = setTimeout(function() {
        console.log('start autohide');
        $('#channel-dashboard').addClass('transparent');
        enableAutoHide(true);
    }, 5000);
}

function resetPlaylist(tags) {
    videoPlaylist = [];
    $('#tag-bug').remove();
    var playlistTags = (typeof tags === 'undefined') ? [] : tags.split(',');
    if (playlistTags.length) {
        tagBugMarkup = '<div id="tag-bug">';
        $.each(playlistTags, function(i, val) {
            if (i > 0) tagBugMarkup += ' + ';
            tagBugMarkup += val;
        });
        tagBugMarkup += '</div>';
        $('#channel-view').append(tagBugMarkup);
    } else {
        $('#tag-bug').remove();
    }

    var tagBugMarkup = '';
    // loop
    $('.video-container').each(function() {
        var $vidContainer = $(this),
            addToPlaylist = true;

        if (playlistTags.length) {
            $.each(playlistTags, function(i, val) {
                if (!$vidContainer.hasClass('tag-'+val)) addToPlaylist = false;
            });
        }

        if (addToPlaylist) {
            var videoData = {};
            videoData.service = ($vidContainer.attr('data-youtube') === undefined) ? 'vimeo' : 'youtube';
            videoData.id = $vidContainer.attr('data-'+videoData.service);
            videoData.title = $vidContainer.find('.video-title').text();
            videoData.desc = $vidContainer.find('.video-desc').html();
            videoData.links = [];
            $vidContainer.find('.video-links li').each(function() {
                videoData.links.push( $(this).html() );
            });
            videoPlaylist.push(videoData);
        }
    });
}

function enableAutoHide(enable) {
    if (enable) {
        dashIsHidden = true;
        $('body').on('mousemove.autohide', function(event) {
            if (dashIsHidden) {
                dashIsHidden = false;
                $('#channel-dashboard').removeClass('transparent');
            }
            clearTimeout(autoHideTimer);
            autoHideTimer = setTimeout(function() {
                dashIsHidden = true;
                $('#channel-dashboard').addClass('transparent');
            }, 1000);
        });
    } else {
        clearTimeout(autoHideTimer);
        $('body').off('mousemove.autohide');
    }
}

function onYouTubeIframeAPIReady() {
    console.log('onYouTubeIframeAPIReady');
    ytPlayer = new YT.Player('yt-player-contain', {
        height: '100%',
        width: '100%',
        playerVars: {
            controls:0,
            showinfo:0,
            wmode:'transparent'
        },
        events: {
            'onReady': onYTPlayerReady,
            'onStateChange': onYTPlayerStateChange
        }
    });
}

function onYTPlayerReady(e) {
    console.log('onYTPlayerReady');
    if (isOn && videoPlaylist[vidIndex].service === 'youtube') {
        playVideo();
    }
}

function onYTPlayerStateChange(e) {
    // play next video when video ends
    if (e.data === YT.PlayerState.ENDED) {
      onVideoFinish();
    }
}

function onVideoFinish() {
    console.log('onVideoFinish');
    vidIndex++;
    playVideo();
}

function addEvent(element, eventName, callback) {
    if (element.addEventListener) {
        element.addEventListener(eventName, callback, false);
    }
    else {
        element.attachEvent('on' + eventName, callback);
    }
}

$(function() {

    // Quad ease in/out
    var scrollEase = function (t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t + b;
        t--;
        return -c/2 * (t*(t-2) - 1) + b;
    };

    // randomly sort video order
    var $videoContainers = $('.video-container');
    $videoContainers.sort(function(a,b){
        var temp = parseInt(Math.random()*10, 10);
        var isOddOrEven = temp%2;
        var isPosOrNeg = temp>5 ? 1 : -1;
        return( isOddOrEven*isPosOrNeg );
    });
    $('.video-container').parent().append($videoContainers);


    // create nav for all the videos create a video data array and playlist from the dom
    var navList = '<ul class="playlist clearfix">';
    $('.video-container').each(function() {
        var videoData = {};
        videoData.service = ($(this).attr('data-youtube') === undefined) ? 'vimeo' : 'youtube';
        videoData.id = $(this).attr('data-'+videoData.service);
        videoData.title = $(this).find('.video-title').text();
        navList += '<li class="playlist-item"><a href="#" class="btn btn-playlist animate" data-vid="'+videoData.service+':'+videoData.id+'">'+videoData.title+'</a></li>';
    });
    navList += '</ul>';
    $($(navList)).insertAfter($('.main-header')).equalize('outerHeight');

    // set playlist to default (play all)
    resetPlaylist();

    // playlist page navigtation
    $('.playlist').on('click','.btn-playlist',function(e) {
        e.preventDefault();
        $listItem = $(this).parent();
        $('html,body').animate({
            scrollTop: $('.video-container').eq($listItem.index()).offset().top-50},
            800,
            scrollEase);
    });

    // watch channel
    $('#videos').on('click','.btn-play',function(e) {
        e.preventDefault();
        vidIndex = $(this).parent().index();
        startChannel();
    });
    
    $('#btn-stop-channel').on('click',function(e) {
        e.preventDefault();
        stopChannel();
    });

    $('#btn-play-main').on('click',function(e) {
        e.preventDefault();
        vidIndex = 0;
        startChannel();
    });

    // go to next video on right arrow key down
    document.onkeydown = function(e) {
        e = e || window.event;

        var playTags;

        for (keyCode in keyMapping) {
            if (keyCode == e.keyCode) {
                playTags = keyMapping[keyCode];
            }
        }
        
        if (playTags) {
            resetPlaylist(playTags);
            vidIndex = 0;
            if (isOn) {
                playVideo();    
            } else {
                startChannel();
            }
        }

        // right arrow or w skips to next video
        if (isOn && e.keyCode === 39 || isOn && e.keyCode === 87) {
            e.preventDefault();
            vidIndex++;
            playVideo();
        }
    };
});