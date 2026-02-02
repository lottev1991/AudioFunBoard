$.event.special.longpress = {
    setup: function () {
        $(this).on('touchstart', start).on('touchend touchmove', stop);
    }
};

let timer;
function start(e) {
    const target = $(e.target);
    timer = setTimeout(() => {
        target.trigger('longpress');
    }, 600); // Adjust duration as needed
}

function stop() {
    clearTimeout(timer);
}

$(function () {
    updateDropdown();

    $("#btn-sec").tabs();

    $("#instructions").dialog({
        autoOpen: false,
        modal: true,
        moveToTop: true,
        position: {
            my: "top",
            at: "top",
            of: "#main-sec"
        },
        draggable: "true",
        width: 500,
    });

    $("#instr-btn").on("click", function () {
        $("#instructions").dialog("open");
    })

    $('.btn').on('click', function () {
        const soundId = $(this).attr('id').replace('btn-', '');
        const audioElement = document.getElementById(soundId);

        if (audioElement) {
            stopAllAudio();
            audioElement.play();
        }
    });

    $('.btn').on('dblclick', function () {
        const audioId = $(this).data('target');
        const audioEl = document.getElementById(audioId);

        if (audioEl) {
            const soundSrc = $(audioEl).attr('src');
            const soundName = $(this).text().trim();
            $('#playlist').append(`<li class="ui-state-default pl-item" data-src="${soundSrc}">${soundName}</li>`);
            console.log("Just added path:", soundSrc);
        }
        savePlaylist();
    });

    $('.btn').on('longpress', function () {
        const audioId = $(this).data('target');
        const audioEl = document.getElementById(audioId);

        if (audioEl) {
            const soundSrc = $(audioEl).attr('src');
            const soundName = $(this).text().trim();
            $('#playlist').append(`<li class="ui-state-default pl-item" data-src="${soundSrc}">${soundName}</li>`);
            console.log("Just added path:", soundSrc);
        }
        savePlaylist();
    });

    $('#playlist').sortable({
        containment: "parent",
        cursor: "grabbing",
        update: function (event, ui) {
            savePlaylist();
        }
    }).on('dblclick', 'li', function () {
        $(this).fadeOut(200, function () {
            $(this).remove();
            savePlaylist();
        });
    }).on('longpress', 'li', function (){
        $(this).fadeOut(200, function () {
            $(this).remove();
            savePlaylist();
        });
    }).on({
        'dragover dragenter': function (e) {
            e.preventDefault();
            e.stopPropagation();
        },
        'drop': function (e) {
            e.preventDefault();
            e.stopPropagation();

            var files = e.originalEvent.dataTransfer.files;
            if (files.length > 0) {
                $(this).empty();
                openFile(files[0]);
            }
        }
    });

    function openFile(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const importedData = JSON.parse(e.target.result);
                const fileName = file.name.replace('.json', '');

                const playlistName = prompt("Name your imported playlist:", fileName);
                if (!playlistName) return;

                localStorage.setItem('playlist_data_' + playlistName, JSON.stringify(importedData));

                let index = JSON.parse(localStorage.getItem('playlist_index')) || [];
                if (!index.includes(playlistName)) {
                    index.push(playlistName);
                    localStorage.setItem('playlist_index', JSON.stringify(index));
                }

                updateDropdown();
                $('#playlist-selector').val(playlistName).trigger('change');

                alert("Imported successfully!");
            } catch (err) {
                alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
    }


    $('#play-playlist-btn').on('click', function () {
        playPlaylist();
    });

    $('#stop-playlist-btn').on('click', function () {
        stopPlaylist();
        $('#play-playlist-btn').text('▶').prop('disabled', false);
    });

    $('#export-btn').on('click', async function () {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const playlistFiles = $('#playlist li').map(function () {
            return $(this).attr('data-src');
        }).get();

        console.log("Current Playlist Paths:", playlistFiles);

        if (playlistFiles.length === 0) return alert("Playlist is empty!");

        const buffers = await Promise.all(playlistFiles.map(async (url) => {
            const resp = await fetch(url);
            const arrayBuf = await resp.arrayBuffer();
            return await audioCtx.decodeAudioData(arrayBuf);
        }));
        const totalDuration = buffers.reduce((acc, buf) => acc + buf.duration, 0);
        const offlineCtx = new OfflineAudioContext(2, audioCtx.sampleRate * totalDuration, audioCtx.sampleRate);

        let currentTime = 0;
        buffers.forEach(buffer => {
            const source = offlineCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(offlineCtx.destination);
            source.start(currentTime);
            currentTime += buffer.duration;
        });

        const renderedBuffer = await offlineCtx.startRendering();
        const wavData = audioBufferToWav(renderedBuffer);
        const blob = new Blob([wavData], { type: 'audio/wav' });
        const fileName = $('#playlist-selector').val()

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName + '.wav';
        a.click();
    });

    $('#clear-playlist-btn').on('click', function () {
        if (confirm("Are you sure you want to clear your entire playlist?")) {
            stopPlaylist();
            $('#playlist').empty();
            $('#play-playlist-btn').text('▶').prop('disabled', false);
        }
    });

    $('#save-playlist-btn').on('click', function () {
        const name = $('#new-playlist-name').val().trim();
        if (!name) return alert("Please enter a name.");

        let index = JSON.parse(localStorage.getItem('playlist_index')) || [];

        if (!index.includes(name)) {
            index.push(name);
            localStorage.setItem('playlist_index', JSON.stringify(index));
        }

        const items = [];
        $('#playlist li').each(function () {
            items.push({
                src: $(this).attr('data-src'),
                name: $(this).text()
            });
        });

        localStorage.setItem('playlist_data_' + name, JSON.stringify(items));

        updateDropdown();
        $('#playlist-selector').val(name);
        savePlaylist();

        alert("Project saved: " + name);
    });

    $('#rename-playlist-btn').on('click', function () {
        const oldName = $('#playlist-selector').val();
        const newName = $('#new-playlist-name').val().trim();

        if (!oldName) return alert("Select a playlist to rename first.");
        if (!newName || oldName === newName) return alert("Enter a new, different name.");

        let index = JSON.parse(localStorage.getItem('playlist_index')) || [];

        if (index.includes(newName)) {
            return alert("A playlist with that name already exists!");
        }

        const data = localStorage.getItem('playlist_data_' + oldName);
        localStorage.setItem('playlist_data_' + newName, data);
        localStorage.removeItem('playlist_data_' + oldName);

        const nameIndex = index.indexOf(oldName);
        if (nameIndex !== -1) {
            index[nameIndex] = newName;
            localStorage.setItem('playlist_index', JSON.stringify(index));
        }

        localStorage.setItem('last_active_playlist', newName);

        updateDropdown();
        $('#playlist-selector').val(newName);

        alert("Playlist renamed to: " + newName);
    });

    $('#playlist-selector').on('change', function () {
        $('#rename-playlist-btn').prop('disabled', !$(this).val());

        const selectedName = $(this).val();
        $('#new-playlist-name').val(selectedName);

        if (!selectedName) {
            $('#playlist').empty();
            $('#last-saved-date').text('Never');
            return;
        }

        const rawData = localStorage.getItem('playlist_data_' + selectedName);
        if (rawData) {
            const dataObj = JSON.parse(rawData);

            const clips = Array.isArray(dataObj) ? dataObj : dataObj.clips;
            const date = dataObj.updatedAt || "Unknown";

            $('#playlist').empty();
            clips.forEach(item => {
                const cleanName = item.name.trim();
                $('#playlist').append(`
                <li class="ui-state-default pl-item" data-src="${item.src}">${cleanName}</li>`);
            });

            $('#last-saved-date').text(date);
            localStorage.setItem('last_active_playlist', selectedName);
            console.log("Persistence Check: Loaded " + clips.length + " clips.");
        }
    });

    $('#delete-playlist-btn').on('click', function () {
        const selectedName = $('#playlist-selector').val();
        if (!selectedName) return;

        if (confirm("Delete " + selectedName + "?")) {
            let index = JSON.parse(localStorage.getItem('playlist_index')) || [];
            index = index.filter(n => n !== selectedName);
            localStorage.setItem('playlist_index', JSON.stringify(index));

            localStorage.removeItem('playlist_data_' + selectedName);

            updateDropdown();
            $('#playlist').empty();
        }
    });

    $('#duplicate-playlist-btn').on('click', function () {
        const currentName = $('#playlist-selector').val();
        if (!currentName) return alert("Select a playlist to duplicate first!");

        const newName = prompt("Enter a name for the duplicate:", currentName + " - Copy");

        if (newName && newName.trim() !== "") {
            const data = localStorage.getItem('playlist_data_' + currentName);

            localStorage.setItem('playlist_data_' + newName, data);

            let index = JSON.parse(localStorage.getItem('playlist_index')) || [];
            if (!index.includes(newName)) {
                index.push(newName);
                localStorage.setItem('playlist_index', JSON.stringify(index));
            }

            updateDropdown();
            $('#playlist-selector').val(newName).trigger('change');
        }
    });

    $('#download-project-btn').on('click', function () {
        const nameSource = $('#new-playlist-name').val().trim() || $('#playlist-selector').val();
        const fileName = (nameSource && nameSource.trim() !== "") ? nameSource : "audioFunBoardPlaylist";

        const data = [];
        $('#playlist li').each(function () {
            data.push({
                src: $(this).attr('data-src'),
                name: $(this).text().trim()
            });
        });

        const exportData = {
            projectName: fileName,
            updatedAt: new Date().toLocaleString(),
            clips: data
        };

        if (data.length === 0) return alert("Nothing to download!");

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = fileName + ".json";
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    $('#import-trigger-btn').on('click', function () {
        $('#import-input').click();
    });

    $('#import-input').on('change', function (e) {
        const file = e.target.files[0];
        openFile(file);
    });

    const lastActive = localStorage.getItem('last_active_playlist');
    const index = JSON.parse(localStorage.getItem('playlist_index')) || [];
    if (lastActive && index.includes(lastActive)) {
        $('#playlist-selector').val(lastActive);
        $('#playlist-selector').trigger('change');
        console.log("Welcome back! Auto-loaded: " + lastActive);
    } else {
        console.log("No previous session found or playlist was deleted.");
    }
});

let currentSources = [];
let audioCtx = null;

function stopAllAudio() {
    $('.audioclip').each(function () {
        this.pause();
        this.currentTime = 0;
    });
}

async function playPlaylist() {
    const $btn = $('#play-playlist-btn');
    $btn.text('⌛').prop('disabled', true);
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }

    const playlistFiles = $('.pl-item').map(function () {
        return $(this).data('src');
    }).get();

    if (playlistFiles.length === 0) return alert("Add some sounds first!");

    stopPlaylist();

    try {
        const buffers = await Promise.all(playlistFiles.map(async (url) => {
            const resp = await fetch(url);
            const arrayBuf = await resp.arrayBuffer();
            return await audioCtx.decodeAudioData(arrayBuf);
        }));

        let startTime = audioCtx.currentTime;

        buffers.forEach((buffer, index) => {
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(audioCtx.destination);

            source.onended = () => {
                $(`#playlist li:eq(${index})`).removeClass('playing');
            };

            source.start(startTime);

            setTimeout(() => {
                $(`#playlist li:eq(${index})`).addClass('playing');
            }, (startTime - audioCtx.currentTime) * 1000);

            if (index === buffers.length - 1) {
                source.onended = () => {
                    $btn.text('▶').prop('disabled', false);
                };
            }

            startTime += buffer.duration;
            currentSources.push(source);
        });
    } catch (err) {
        console.error("Playback failed:", err);
        alert("Error loading sounds. Check file paths.");
    }
}

function stopPlaylist() {
    currentSources.forEach(s => s.stop());
    currentSources = [];
}

function audioBufferToWav(buffer) {
    let numOfChan = buffer.numberOfChannels,
        length = buffer.length * numOfChan * 2 + 44,
        bufferArr = new ArrayBuffer(length),
        view = new DataView(bufferArr),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    // WAV header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"
    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);  // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit
    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    // Interleaved audio data
    for (i = 0; i < buffer.numberOfChannels; i++)
        channels.push(buffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {           // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF); // scale to 16-bit signed
            view.setInt16(pos, sample, true);      // write 16-bit sample
            pos += 2;
        }
        offset++;
    }

    return bufferArr;

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}

function savePlaylist() {
    const currentName = $('#playlist-selector').val();
    if (!currentName) return;

    const items = [];
    $('#playlist li').each(function () {
        items.push({
            src: $(this).attr('data-src'),
            name: $(this).text()
        });
    });

    if (items.length === 0) {
        console.warn("Attempted to save an empty list. Aborting to prevent data loss.");
        return;
    }

    const timestamp = new Date().toLocaleString();
    const playlistObject = {
        updatedAt: timestamp,
        clips: items
    };

    localStorage.setItem('playlist_data_' + currentName, JSON.stringify(playlistObject));

    $('#last-saved-date').text(timestamp);

    console.log("Successfully saved " + currentName + " at " + timestamp);
}

function updateDropdown() {
    const index = JSON.parse(localStorage.getItem('playlist_index')) || [];
    const $selector = $('#playlist-selector');

    $selector.find('option:not(:first)').remove();

    index.forEach(name => {
        $selector.append(`<option value="${name}">${name}</option>`);
    });
}