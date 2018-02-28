class ResponsiveHelper{

    static createResponsiveImageBlock(restaurant,pictureElement){
        const sourceHuge = document.createElement('source');
        sourceHuge.setAttribute('media','(min-width: 1025px)');
        sourceHuge.setAttribute('srcset','img/'+restaurant.id+'-huge.jpg');
        pictureElement.appendChild(sourceHuge);
        const sourceLarge = document.createElement('source');
        sourceLarge.setAttribute('media','(min-width: 420px) and (max-width:1024px)');
        sourceLarge.setAttribute('srcset','img/'+restaurant.id+'-large.jpg');
        pictureElement.appendChild(sourceLarge);
        const sourceSmall = document.createElement('img');
        sourceSmall.setAttribute('srcset','img/'+restaurant.id+'-small.jpg');
        sourceSmall.setAttribute('alt','Image of the '+restaurant.name+' restaurant');
        pictureElement.appendChild(sourceSmall);

    }
}