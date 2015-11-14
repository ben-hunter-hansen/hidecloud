//Set ext scope variables
var hiddenTracks, numVisible;
hiddenTracks = localStorage.hiddenTracks ? JSON.parse(localStorage.hiddenTracks) : {};

// details about the current track
var trackInfo = {
	element: {},
	title: "",
	href: ""
};

var songList = document.createElement('ul');

if (jQuery) {
	$(document).ready(function(){
		$(songList).addClass('hidden-songs');
		$('body').append(songList);
		showBtn();
		//Get number of visible tracks
		numVisible = $('ul.lazyLoadingList__list.sc-list-nostyle.sc-clearfix .soundList__item:visible').length;
		
		//Loop through all visible items, 4500 seems acceptably slow for soundcloud ajax requests		
		setTimeout(iterateItems, 1500);

		//On click of hide track button, execute hide track function
		$('body').on('click', 'a.hide-track', function() {
			hideTrack($(this));
		});
		
		$('body').on('click', 'a.unhide-track', function() {
			unhideTrack($(this).data('href'), $(this).data('track'));
		});


		//Every time you scroll, this checks to see if the saved number of visible tracks is less than what searching the dom comes up with 
		$(document).scroll(function(){ 
			if ($('ul.lazyLoadingList__list.sc-list-nostyle.sc-clearfix .soundList__item').length > numVisible) {
				numVisible = $('ul.lazyLoadingList__list.sc-list-nostyle.sc-clearfix .soundList__item:visible').length;
				iterateItems(hiddenTracks);
			}
		});


		$('.playControls .skipControl__previous').on('click', function() { trackInfo.skipBack = true; });
		
		if (Object.keys(hiddenTracks).length > 0) {			
			$('.show-hidden').fadeIn();
			populateHiddenList();
		}
		
	});


	//Loops through all of the visible items and hides them if localStorage deems them a hidden track
	function iterateItems() {
		$('li.soundList__item').each(function() {
			var listItem, group, songName, buttonGroup, href;
			listItem = $(this);

			if (listItem) group = $(this).find('div[role="group"]');
			if (group) { href = group.find('.soundTitle__title').attr('href'); songName = group.attr('aria-label'); }
			if (listItem) buttonGroup = $(this).find('div.sc-button-group').first();
	
			if(href != undefined && hiddenTracks && href in hiddenTracks) 
				listItem.hide();
			

			if ($(buttonGroup).find('.hide-track').length == 0)
				$(buttonGroup).append("<a class='sc-button hide-track sc-button-small sc-button-responsive' data-track='"+ songName +"' data-href='" + href + "' title='Hide This Track'>HIDE</a>")

		});
	}
	
	function showBtn() {
		if ($('.show-hidden') != '') { 
			var showHiddenBtn = document.createElement('a');		
			showHiddenBtn.href = "#";
			$(showHiddenBtn).addClass('show-hidden');			
			showHiddenBtn.text = "You have hidden tracks! Click to see them";
			
			$('body').append(showHiddenBtn);
		}
	}
	
	$('body').on('click', '.show-hidden', function() {
		$(this).text() === 'You have hidden tracks! Click to see them' ? showSongList() : hideSongList();
	});
	
	function showSongList() {		
		$('.hidden-songs').slideDown();
		$('.show-hidden').text('Hide this list!'); 
	}
	
	function hideSongList() {
		$('.hidden-songs').slideUp();
		$('.show-hidden').text('You have hidden tracks! Click to see them'); 		
	}

	//Hides the track and adds the track name to the localStorage object
	function hideTrack(e) {
		var href, listItem, songName;
		href = e.attr('data-href');

		songName = e.attr('data-track');
		listItem = e.closest('li.soundList__item');

		numVisible--;
		hiddenTracks[href] = songName;
		listItem.slideUp();
		localStorage.hiddenTracks = JSON.stringify(hiddenTracks);
		populateHiddenList();
		$('a.show-hidden').slideDown();
		
		if (trackInfo.href == href) {
			nextSong();
		}
		
	}
	
	function unhideTrack(href, songName) {
		var track = $('[aria-label="'+songName+'"]');
		track.closest('.soundList__item').slideDown();
		delete hiddenTracks[href];

		localStorage.hiddenTracks = JSON.stringify(hiddenTracks);
		populateHiddenList();
	
		if (Object.keys(hiddenTracks).length == 0) {
			hideSongList();
			$('a.show-hidden').slideUp();
		}
	}
	
	function populateHiddenList() {
		$(songList).html('');
	
		for (var href in hiddenTracks) {
			var songName = hiddenTracks[href];
			var li = document.createElement('li');
			var unhideBtn = document.createElement('a');
			
			$(li).text(songName);
			$(unhideBtn).text("UNHIDE").addClass('unhide-track').attr('style', 'color: red; float: right;').attr('href', '#').attr('data-href', href).attr('data-track', songName);
			$(li).append(unhideBtn);

			$(songList).append(li);				
		}
	}
	
	function isTrackHidden(trackUrl) {
		return (trackUrl && parsePlaylistHref(trackUrl) in hiddenTracks)
	}

	function parsePlaylistHref(href) {
		return href.indexOf("?in=") > -1 ? (href.split("?in=")[1][0] !== '/') ? '/' + href.split("?in=")[1] : href.split("?in=")[1] : href;
	}

	function skipControl() {
		return trackInfo.skipBack ? $('.playControls .skipControl__previous') : $('.playControls .skipControl__next');
	}
	
	function nextSong() {
		$('.skipControl__next').click();
	}
	
	var playingObserver = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {

			trackInfo.element = document.querySelector('.playbackSoundBadge__title');

			// Only check hidden tracks if songTitle is a descendant
			// of the mutation target element.
			if($.contains(mutation.target, trackInfo.element)) {
				trackInfo.href = $(trackInfo.element).attr('href');

				if(isTrackHidden(trackInfo.href)) {
					skipControl().trigger("click");
				} else {
					trackInfo.skipBack = false;
				}
			}
		});
	});
	var currentPlaying = document.querySelector('.playControls');					
	playingObserver.observe(currentPlaying , { attributes: true, childList: true, characterData: true, subtree : true });
} else {
	console.log('Hidecloud is not active');
}

