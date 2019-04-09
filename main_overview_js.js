// Get the formModal
var formModal = document.getElementById('newGalleryModal');
var successModal = document.getElementById("successModal");
var galleryModal = document.getElementById("galleryModal");
formModal.style.display = "none";
successModal.style.display = "none";
galleryModal.style.display = "none";
var form = document.getElementById('optionsObjectForm');
var formContainerSizeRefference = form.elements["container_size"];
var formApiUrlRefference = form.elements["api_url"];
var formLoopingEnabledRefference = form.elements["looping_enabled"];
var formContainerSizeError = document.getElementById("container-size-error");
var formApiUrlError = document.getElementById("api-url-error");
var formCheckboxError = document.getElementById("checkbox-error");
var formUrlRegexTest = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;
var formContainerSizeRegexTest = /(\d+) ?((px)|(%))/;
// Get the background
var background = document.getElementById("main-bg");
var injectionElement = document.getElementById("row-id");
var galleryInsertElement = document.getElementsByClassName("modal-gallery-content")[0];

var curXPos, curDown; // variables for holding various mouse cursor info
var touchXPos, touchDown; // variables for holding touch info

// I realse all of the below could just be accessed with the document selector, but I used variables because its
// shorter to write and ill be using them alot
var imageHorizontalAnchorsArray; // array that holds image anchor points to snap to in scrolling
var imageHorizontalWidthArray; // array that holds the respective image widths
var imageHorizontalOffsetLeftArray; // array that holds the respective image offset lefts


var scrollNeeded; // boolean value, if scrolling is needed or if the gallery is in full view without being clipped
var containerSize; // size of currently open gallery images;
// Get the button that opens the formModal
var newGalBtn = document.getElementById("new-gallery-button");

var closeFormBtn = document.getElementById("closeForm");
var closeSuccessBtn = document.getElementById("closeSuccess");
var closeGalleryBtn = document.getElementById("closeGallery");

newGalBtn.onclick = function() {
    showFormModal();
};
closeFormBtn.onclick = function() {
    hideFormModal();
};
closeSuccessBtn.onclick = function() {
    hideSuccessModal();
};
closeGalleryBtn.onclick = function() {
    hideGalleryModal();
};

var loopingSet = false; // whether or not gallery will loop, set this trough user form
var scrollValue; // last variables to be declared, its related to event listeners below
var currentImageIndex = 0;

var tresholdValue = 0; // user defined treshold selection value ( not used yet, not sure how and where to implement )

galleryInsertElement.addEventListener('scroll', function(e) {
    updateCurrentImageIndex();
});
galleryInsertElement.addEventListener('onscroll', function(e) { // the event listener for touch events, however this works differently than scroll
    //updateCurrentImageIndex(); // because it fires after it the scroll ends
});
galleryInsertElement.addEventListener('mousemove', function(e){
    if(curDown){
        galleryInsertElement.scrollLeft = scrollValue + (curXPos - e.pageX)*1.5;
    }
});
galleryInsertElement.addEventListener('mousedown', function(e){
    scrollValue = galleryInsertElement.scrollLeft;
    curXPos = e.pageX;
    curDown = true;
});
galleryInsertElement.addEventListener('mouseup', function(e){
    if(scrollNeeded){
        scrollbarClosestSelection();
    }
    curDown = false;
});

galleryInsertElement.addEventListener('touchmove', function(e){
    if(touchDown){
        galleryInsertElement.scrollLeft = scrollValue + (touchXPos - e.touches[0].clientX);
    }
});
galleryInsertElement.addEventListener('touchstart', function(e){
    scrollValue = galleryInsertElement.scrollLeft;
    touchXPos = e.touches[0].clientX;
    touchDown = true;
});
galleryInsertElement.addEventListener('touchend', function(e){
    if(scrollNeeded){
        scrollbarClosestSelection();
    }
    touchDown = false;
});

// When the user clicks anywhere outside of the formModal, close it, and also always
// attempt to close success modal if opened, so it acts like a bootstrap flash message
// this could be redone in a better way
window.onclick = function(event) {
    if (event.target === formModal) {
        hideFormModal();
    }
    hideSuccessModal();
};
// if gallery is opened and window gets resized, recalculate the image pixel borders
window.addEventListener('resize', function(){
    getCurrentHorizontalAnchorsArray();
}, true);
// when form is hidden, remove its errors if any exist
var observer = new MutationObserver(function(){
    if(formModal.style.display =='none' ){
        clearErrors();
    }
});
observer.observe(formModal,  { attributes: true, childList: true });

// required for ajax, prevents default form submit action from firing
// then i bind my javascript validate function
form.addEventListener("submit", function(event){
    event.preventDefault();
    validateOptionsObjectForm();
});

//always loads everything from local storage, so things arent lost on refresh
injectGalleryFromLocalStorage();
function clearLocalStorage(){
    localStorage.clear();
}
// retrieves number of gallery objects in local storage
function getGalleryCount(){
    var counter1 = 0;
    do{
        if(localStorage.getItem(counter1.toString())===null){
            return counter1;
        }else {
            counter1 = counter1 + 1;
        }
    }while(true);
}
// adds gallery object to local storage
function appendGalleryToLocalStorage(galleryObject){
    var counter1 = 0;
    do{
        // Add item to the local storage
        if(localStorage.getItem(counter1.toString())===null){
            localStorage.setItem(counter1.toString(), JSON.stringify(galleryObject));
            break;
        }else {
            counter1 = counter1 + 1;
        }
    }while(true);
    return counter1;
}
// this function either creates one thumbnail for the specified gallery (when inserting new one)
// , or creates them all when called without parameters, it does this on refresh mostly
function injectGalleryFromLocalStorage(optionalSingleGallery, optionalIndex){
    if (optionalSingleGallery === undefined && optionalIndex === undefined) {
        var counter1 = 0;
        while(localStorage.getItem(counter1.toString())!==null){
            // Add images to the gallery
            var iterGallery = JSON.parse(localStorage.getItem(counter1.toString()));
            injectNewGalleryHtml(iterGallery, counter1);
            counter1 = counter1 + 1;
        }
    }else{
        injectNewGalleryHtml(optionalSingleGallery, optionalIndex);
    }
}
// creates a new thumbnail element for the gallery
function injectNewGalleryHtml(galleryObject, galleryIndex){
    var htmlValue = document.createElement('a');
    htmlValue.className = "gallery gallery-filled "+galleryIndex;
    htmlValue.innerHTML = "";
    htmlValue.onclick = function() {
        openGallerySlideShow(galleryObject, galleryIndex);
    };
    var galThumbnail = getImageUrl(galleryObject,0);
    htmlValue.style.backgroundImage = "url(" + galThumbnail + ")";
    injectionElement.insertBefore(htmlValue, newGalBtn);
}
function getImageUrl(galleryObject, indexImage){
    var imageHash = galleryObject["images"];
    return imageHash[indexImage]["url"];
}
function getImageName(galleryObject, indexImage){
    var imageHash = galleryObject["images"];
    return imageHash[indexImage]["name"];
}
function openGallerySlideShow(galleryObject, galleryIndex){
    galleryInsertElement.innerHTML = "";
    var paginationElement = document.getElementsByClassName("pagination")[0];
    currentImageIndex = 0;
    paginationElement.innerHTML = "";
    loopingSet = false; // default reset
    var imageCount = galleryObject["images"].length;
    containerSize = galleryObject["containerSize"];
    if(!formContainerSizeRegexTest.test(containerSize)) {
        containerSize = "100%" // if somehow size is invalid, default is 50%
    }
    if(galleryObject["loopingEnabled"]==="true"){
        loopingSet = true; // enable or disable looping
    }
    // remove whitespaces
    containerSize = containerSize.replace(/\s/g, '');
    //galleryInsertElement.style.setProperty('--height', containerSize);
    // I add a transparent image, that is not really part of the gallery
    // at the start and at the end, to make the gallery look nicer with padding that doesnt break the flow
    // this is very hackish but the images are thin so they are hard to get selected
    var imageNode = document.createElement('img');
    imageNode.src = "assets/gallery_transparent_border.png";
    imageNode.alt = "border-start";
    imageNode.style.setProperty('--height', containerSize);
    galleryInsertElement.appendChild(imageNode);

    for (var i = 0; i < imageCount; i++) {
        var imageNode = document.createElement('img');
        imageNode.src = getImageUrl(galleryObject,i);
        imageNode.alt = getImageName(galleryObject,i);
        imageNode.style.setProperty('--height', containerSize);
        imageNode.id += "image"+i;
        galleryInsertElement.appendChild(imageNode);
        var spanPaginationNode = document.createElement("span");
        paginationElement.appendChild(spanPaginationNode);
    }

    var imageNode = document.createElement('img');
    imageNode.src = "assets/gallery_transparent_border.png";
    imageNode.alt = "border-end";
    imageNode.style.setProperty('--height', containerSize);
    galleryInsertElement.appendChild(imageNode);
    showGalleryModal();
    setTimeout(function() { // Small timeout for the images to load, else i get width 0 when calculating borders
        getCurrentHorizontalAnchorsArray();
        scrollbarClosestSelection();
        loopingInit();
        updatePagination();
    }, 100);
}
function getCurrentHorizontalAnchorsArray(){
    if(galleryInsertElement.innerHTML!==""){
        var maxScrollbarLeft = galleryInsertElement.scrollWidth - galleryInsertElement.clientWidth;
        if(galleryInsertElement.scrollLeft == maxScrollbarLeft){
            scrollNeeded = false;
            return;
        }else{
            scrollNeeded = true;
        }
        var returnArray = [];
        var returnWidthArray = []; // also stores the width and offsetleft of respective images
        var returnLeftArray = [];
        var childrenImages = galleryInsertElement.children;
        // start at 1 and end before last to avoid last 2 blank image borders
        for (var i = 1; i < childrenImages.length-1; i++) {
            var childImageAnchor = childrenImages[i].offsetLeft+childrenImages[i].offsetWidth/2-window.innerWidth/2;
            returnArray.push(childImageAnchor);
            returnWidthArray.push(childrenImages[i].offsetWidth);
            returnLeftArray.push(childrenImages[i].offsetLeft);
        }
        imageHorizontalAnchorsArray = returnArray;
        imageHorizontalWidthArray = returnWidthArray;
        imageHorizontalOffsetLeftArray = returnLeftArray;
        // array with center of screen image positions
    }
}
// updates currently visible image, this is the function that i think would need improving the most
// where a lot of images with small width are visible, it fails to recognize which one is in the center,
// (which one is the "main" visible one)
function updateCurrentImageIndex(){
    var arrayCounter;
    var imagesInViewCenters = [];
    var imagesInViewIndexes = [];
    for(arrayCounter=0;arrayCounter<imageHorizontalAnchorsArray.length;arrayCounter+=1){
        var imageAnchor = imageHorizontalAnchorsArray[arrayCounter];
        var imageWidth = imageHorizontalWidthArray[arrayCounter];
        var currentScrollPos = galleryInsertElement.scrollLeft;
        // these bounds are just the left and right extremes where image is still visible without clipping
        // i would be very happy to explain them in person :D
        var imageHigherBound = imageAnchor+window.innerWidth/2-imageWidth/2;
        var imageLowerBound = imageAnchor-window.innerWidth/2+imageWidth/2;
        if(imageHigherBound<imageLowerBound){
            var temp = imageHigherBound;
            imageHigherBound = imageLowerBound;
            imageLowerBound = temp;
        }
        var centerBound = (imageHigherBound+imageLowerBound)/2;
        //console.log("current: "+currentScrollPos+" low: "+imageLowerBound+" high: "+imageHigherBound);
        imagesInViewCenters.push(centerBound);
        imagesInViewIndexes.push(arrayCounter);
    }
    var indexOfTarget = closestIndex(imagesInViewCenters,currentScrollPos);
    currentImageIndex = imagesInViewIndexes[indexOfTarget];
    updatePagination();
    console.log(currentImageIndex);
}
function goToItem(index){
    if(galleryInsertElement.innerHTML!==""){
        galleryInsertElement.scrollTo({top: 0,left: imageHorizontalAnchorsArray[index],behavior: 'smooth'});
    }
}
function nextItem(){
    goToItem(currentImageIndex+1);
}
function previousItem(){
    goToItem(currentImageIndex-1);
}
var intervalVariable = ""; // just a variable to hold the interval so i can unset and set it outside the function
function loopingInit(){
    if (loopingSet === true){
        var counter = currentImageIndex;
        intervalVariable = setInterval(function() {
            if(counter===imageHorizontalAnchorsArray.length){
                counter = 0;
            }
            goToItem(counter);
            counter = counter + 1;
            if(loopingSet ===false){
                clearInterval(intervalVariable);
                intervalVariable = "";
            }}, 3000);
    }else{
        clearInterval(intervalVariable);
        intervalVariable = "";
    }
}
function scrollbarClosestSelection(){ // This is the function that smooths into the selections (focuses on one selection)
    goToItem(currentImageIndex)
}
function updatePagination(){
    var paginationElement = document.getElementsByClassName("pagination")[0];
    var childrenDots = paginationElement.children;
    // start at 1 and end before last to avoid last 2 blank image borders
    for (var i = 0; i < childrenDots.length; i++) {
        if(i===currentImageIndex){
            childrenDots[i].className = "active";
        }else{
            childrenDots[i].className = "";
        }
    }
}
function validateOptionsObjectForm(){ // Just does some basic and simple form validations
    // then submits if valid
    var urlValid = formUrlRegexTest.test(formApiUrlRefference.value);
    var containerSizeValid = formContainerSizeRegexTest.test(formContainerSizeRefference.value);
    var numberOfGalleries = getGalleryCount();

    if(!urlValid){
        formApiUrlError.innerHTML="Please make sure the url is correct!";
        formApiUrlRefference.style.boxShadow="0 0 3px #CC0000";
    }
    if(!containerSizeValid){
        formContainerSizeError.innerHTML="Please use percentage or pixel values ( like 3 % or 300 px)!";
        formContainerSizeRefference.style.boxShadow="0 0 3px #CC0000";
    }
    if(!urlValid||!containerSizeValid){
        return;
    }
    if(numberOfGalleries>20){ // Since i dont resize gallery thumbnails icons each time i add a new gallery
        // the gallery can eventually get filled up, which then enables an ugly vertical scrollbar
        // i could just resize them after adding an element too, if needed.
        alert("Number of galleries is at capacity (20), the gallery will now be reset!");
        clearLocalStorage();
    }

    var formSubmitData = new FormData();
    formSubmitData.append("containerSize",formContainerSizeRefference.value);
    formSubmitData.append("apiUrl",formApiUrlRefference.value);
    formSubmitData.append("loopingEnabled",formLoopingEnabledRefference.checked);

    var ajaxRequest = new XMLHttpRequest();
    ajaxRequest.open("POST", "functions.php", true);
    ajaxRequest.onload = function(oEvent) {
        if (ajaxRequest.status == 200) {
            hideFormModal();
            clearFormValues(); // resets form
            if(!isJson(ajaxRequest.responseText)){
                alert("Error with reading api format data, please provide valid API!")
            }else {
                showSuccessModal();
                var galleryObject = JSON.parse(ajaxRequest.responseText);
                var galleryIndex = appendGalleryToLocalStorage(galleryObject);
                // the function above returns an index of where the gallery got appended
                injectGalleryFromLocalStorage(galleryObject,galleryIndex);
                // adds the gallery into the document with the thumbnail
            }
        } else {
            alert("Error " + ajaxRequest.status + ". This shouldn't happen :(");
            clearErrors();
        }
    };
    ajaxRequest.send(formSubmitData);
}
function isJson(str) { // a simple function to check if string is valid json
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
function clearFormValues(){
    formContainerSizeRefference.value = "";
    formApiUrlRefference.value = "";
    formLoopingEnabledRefference.checked = false;
}
function clearErrors(){
    formApiUrlError.innerHTML="";
    formCheckboxError.innerHTML="";
    formContainerSizeError.innerHTML="";
    formApiUrlRefference.style.boxShadow="0 0 0px #000000";
    formContainerSizeRefference.style.boxShadow="0 0 0px #000000";
}
function fadeBackground(){ //adds semi transparent layers to get the bootstrap out of focus effect
    background.style.backgroundImage = "linear-gradient(to right, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6) ),url('assets/background_celtra_version1.jpg')";
}
function unfadeBackground(){ //reverses the above, by removing the layers
    background.style.backgroundImage = "url('assets/background_celtra_version1.jpg')";
}
function showFormModal(){
    formModal.style.display = "block";
    fadeBackground();
}
function hideFormModal(){
    unfadeBackground();
    formModal.style.display = "none";
}
function showSuccessModal(){
    successModal.style.display = "block";
}
function hideSuccessModal(){
    successModal.style.display = "none";
}
function hideGalleryModal(){
    galleryModal.style.display = "none";
    clearInterval(intervalVariable); // clears the looping timer if it exists at all
}
function showGalleryModal(){
    galleryModal.style.display = "block";
}
function xinspect(o,i){ // a useful debugging function someone made on stack overflow
    if(typeof i=='undefined')i='';
    if(i.length>50)return '[MAX ITERATIONS]';
    var r=[];
    for(var p in o){
        var t=typeof o[p];
        r.push(i+'"'+p+'" ('+t+') => '+(t=='object' ? 'object:'+xinspect(o[p],i+'  ') : o[p]+''));
    }
    return r.join(i+'\n');
}
function closestIndex(array,target){ // a useful function for returning the number closest to "target" from array
    var i=0;
    var minDiff = Number.MAX_VALUE; // positive infinity basically unset difference
    var ans;
    for(i;i<array.length;i+=1){
        var m=Math.abs(target-array[i]);
        if(m<minDiff){
            minDiff=m;
            ans=i;
        }
    }
    return ans;
}