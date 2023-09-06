import "@patternfly/react-core/dist/styles/base.css";
import React, { useState, useEffect, useCallback, } from "react";
import { connect } from "react-redux";
//import { Button } from "@mui/material";
import axios from "axios";
import { resetSearch, searchPhoto } from "../actions";
import {
  Form,
  FormGroup,
  TextInput,
  Checkbox,
  Popover,
  Divider,
  ActionGroup,
  Radio,
  Button,
  HelperText,
  HelperTextItem,
  FormHelperText,
  Bullseye,
  Card,
  CardHeader,
  CardActions,
  CardFooter,
  CardTitle,
  CardBody,
  Dropdown,
  DropdownToggle,
  DropdownItem,
  DropdownSeparator,
  DropdownPosition,
  DropdownToggleCheckbox,
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  EmptyStateSecondaryActions,
  FormSelect,
  FormSelectOption,
  Gallery,
  KebabToggle,
  OverflowMenu,
  OverflowMenuControl,
  OverflowMenuDropdownItem,
  OverflowMenuItem,
  PageSection,
  PageSectionVariants,
  Pagination,
  Select,
  SelectOption,
  SelectVariant,
  TextContent,
  Text,
  Title,
  Toolbar,
  ToolbarItem,
  ToolbarFilter,
  ToolbarContent
} from '@patternfly/react-core';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleNotch,
  faSync,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import QRCode from 'qrcode';

import "./Photo.scss";
import "./fonts.css"
function Photo({
  reset,
  searchPhoto,
  predictionPending,
  predictionResponse,
  prediction,
  predictionError,
  minScore,
  labelSettings,
  status,
}) {
  const [image, setImage] = useState(null);
  const [catalog, setCatalog] = useState(false)
  const [productPrediction, setProductPrediction] = useState([])
  const [cameraEnabled, setCameraEnabled] = useState(null);
  const [clothes, setClothes] = useState([])
  const [video, setVideo] = useState(null);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const [imageCanvas, setImageCanvas] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [zonesCanvas, setZonesCanvas] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [qrCodeUrl, setQRCodeUrl] = useState('');
  const [pseudo,setPseudo] = useState({pseudoName:"", pseudoId:-1})
  const [pseudoDefined,setPseudoDefined] = useState(false)
  const [shopWindow,setshopWindow] = useState(false)
  // InventoryImage is used to display an image from inventory when there is no prediction to display (display sellingItem)
  const [inventoryImage,setInventoryImage]= useState(false)
  const [itemToSell,setItemToSell] = useState([])
  const [itemToEdit,setItemToEdit] = useState([])
  const [pseudoUnicityError,setPseusoUnicityError] = useState(false)


useEffect(() => {
  // check if pseudo Defined
  console.log("USE EFFECT PSEUDO")
  const pseudo = JSON.parse(localStorage.getItem('pseudo'))
  setPseudoDefined((pseudo.pseudoId!==-1))
  setPseudo(pseudo)
}, []); 
  
  const userSession = 'aaabbbbaaaa'
  useEffect(() => {
    enableCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    drawDetections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prediction]);

/*   useEffect(() => {
    const currentAddress = window.location.href;
    QRCode.toDataURL(currentAddress, function(err, url) {
      if (err) throw err;
      setQRCodeUrl(url);
    });
  }, []);
 */
  const videoRef = useCallback(
    (node) => {
      setVideo(node);
      if (node) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode } })
          .then((stream) => (node.srcObject = stream));
      }
    },
    [facingMode]
  );

  const imageCanvasRef = useCallback((node) => {
    setImageCanvas(node);
  }, []);

  const zonesCanvasRef = useCallback((node) => {
    setZonesCanvas(node);
  }, []);

  function enableCamera() {
    setCameraEnabled(!cameraEnabled);
    setImage(null);
  }

  function onCameraToggled() {
    reset();
    enableCamera();
  }

  function onCameraClicked() {
    setQRCodeUrl(false)
    updateImageCanvas();

    let imageData = imageCanvas.toDataURL("image/jpeg");
    const base64data = imageData.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
    searchPhoto(base64data);
  }

  function updateImageCanvas() {
    setVideoWidth(video.videoWidth);
    setVideoHeight(video.videoHeight);
    if (!imageCanvas) {
      return;
    }

    imageCanvas.width = video.videoWidth;
    imageCanvas.height = video.videoHeight;

    imageCanvas.getContext("2d").drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    video.srcObject.getVideoTracks().forEach((track) => {
      track.stop();
    });
    setImage(imageCanvas.toDataURL());

    setCameraEnabled(false);
  }

  function drawDetections() {
    if (!prediction || !prediction.detections || !imageCanvas.getContext) {
      return;
    }
    const displayBox = prediction.displayBox;

    console.log(" PREDICITION ",prediction['detections'])
    console.log(" PREDICITION . ",prediction.detections)
    console.log(" TO CLOTHEOBJECT PREDICTION ",prediction)
    toClotheObject(prediction['detections'],prediction.image_url)
    //display item to edit
    setshopWindow(true)
    prediction.detections.filter((d) => d.score > minScore).forEach((d) => drawDetection(d,displayBox));
  }

  function drawDetection({ box, label, score, cValue }, displayBox) {
    const drawScore = true;
    const textBgHeight = 14;
    const padding = 2;
    const letterWidth = 6;
    const scoreWidth = drawScore ? 4 * letterWidth : 0;
    const text = drawScore ? `${label} ${Math.floor(score * 100)}% Confidence` : label;

    const width = Math.floor((box.xMax - box.xMin) * imageCanvas.width);
    const height = Math.floor((box.yMax - box.yMin) * imageCanvas.height);
    const x = Math.floor(box.xMin * imageCanvas.width);
    const y = Math.floor(box.yMin * imageCanvas.height);
    const labelSetting = labelSettings[label];
    const labelWidth = text.length * letterWidth + scoreWidth + padding * 2;

    const ctx = imageCanvas.getContext("2d");
    if (displayBox) {
      drawBox(ctx, x, y, width, height, labelSetting.bgColor);
      drawBoxTextBG(ctx, x, y + height - textBgHeight, labelWidth, textBgHeight, labelSetting.bgColor);
      drawBoxText(ctx, text, x + padding, y + height - padding);
    }
    //clearZone(ctx, x + 5, y + height - textBgHeight - 4, labelWidth, textBgHeight);
    //clearZone(ctx, x, y, width, height);
  }

  function drawBox(ctx, x, y, width, height, color) {
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 15]);
    ctx.strokeStyle = color;
    ctx.strokeRect(x, y, width, height);
  }

  function drawBoxTextBG(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1.0;
  }

  function drawBoxText(ctx, text, x, y) {
    ctx.font = "12px Verdana";
    ctx.fillStyle = "white";
    ctx.fillText(text, x, y);
  }

  function onFacingModeClicked() {
    if (facingMode === "user") {
      setFacingMode("environment");
    } else {
      setFacingMode("user");
    }
  }




  function renderCamera() {
    
    const displayResult = pseudoDefined ? {} : { display: "none" };
    if (!cameraEnabled || image) {
      return null;
    }
    //after prediction returned
    // display the sellingLayout
    return (

      <div className="camera" style={displayResult}>
        <Title headingLevel="h2" >Take a picture of items you want to sell/give !</Title>
        <div className="img-preview">
          <div className="img-container">
            <video
              className="camera-preview"
              ref={videoRef}
              controls={false}
              autoPlay
              playsInline
            />
          </div>
        </div>
        <div className="left-button-container button-container">
          <Button
            variant="contained"
            size="large"
            className="choose-camera-button"
            onClick={onFacingModeClicked}
          >
            <FontAwesomeIcon icon={faSync} />
          </Button>
        </div>
        <div className="center-button-container button-container">
          <Button
            variant="contained"
            size="large"
            className="take-picture-button"
            onClick={onCameraClicked}
          >
            <FontAwesomeIcon icon={faCircle} />
          </Button>
        </div>
      </div>
    );
  }

  function renderSnapshot() {
    const displayResult = (image || shopWindow) ? {} : { display: "none" };

    const displayButtons = predictionPending ? { display: "none" } : {};
    const displayLoading = predictionPending ? {} : { display: "none" };

    //      (!predictionPending && predictionError) || (!inventoryImage)

   const displayError =
      (!predictionPending && predictionError)
        ? { width: `${videoWidth}px`, height: `${videoHeight}px` }
        : { display: "none" };

    const displayImage =
      (!predictionPending && !predictionError && prediction) ? {} : { display: "none" };

    let displayNoObjects;

    // Get Predictions from IA inference

    

    displayNoObjects = { display: "none" }; // Never show no objects
    return (

      <div className="result" style={displayResult}>
        <div className="img-preview">
          <div className="error-container" style={displayError}>
            <h2>
              <FontAwesomeIcon className="error-icon" icon={faExclamationCircle} /> Error
            </h2>
            <code>{JSON.stringify(predictionError, null, 2)}</code>
          </div>
          <div className="img-container" style={displayImage}>
            <canvas className="result-canvas" ref={imageCanvasRef} />
            <div className="zones overlay">
              <canvas className="zones-canvas" ref={zonesCanvasRef} />
            </div>
            <div className="loading overlay" style={displayLoading}>
              <div>
                <FontAwesomeIcon className="loading-icon" icon={faCircleNotch} spin />
              </div>
              <div className="loading-text">Loading ...</div>
            </div>
            <div className="no-objects overlay" style={displayNoObjects}>
              <div className="no-objects-text">No Objects</div>
              <div className="no-objects-text">Found</div>
            </div>
          </div>
        </div>
        <div className="left-button-container button-container" style={displayButtons}>
        <Button
            variant="contained"
            size="large"
            onClick={getCatalog}
          >
            <span className="label-word">Show my dressing</span>
          </Button>
        </div>
        <div className="center-button-container button-container" style={displayButtons}>
          <Button
            variant="contained"
            size="large"
        
            onClick={onCameraToggled}
          >
            <span className="label-word">Take a new picture ! </span>
          </Button>
        </div>
        <div className="right-button-container button-container" style={displayButtons}></div>
      </div>
    );
  }

  function renderQRCode() {
   // const displayQRcode = image ? {} : { display: "none" };
   // hide qr code
   // to do , add main variable outside as image ..

   const displayQRcode = !pseudoDefined ? {} : { display: "none" };
    return (
      <div className="img-preview">
        <img src={qrCodeUrl} alt="QR Code" style={displayQRcode} />
      </div>
    );
  }


  const handlePseudoCreation = (_event) => {

    
      axios.post('http://localhost:8083/pseudos', 
      {"pseudoName" : pseudo.pseudoName}
    ,{headers:
      {'Content-Type': 'application/json'}
        })
    .then((response) => {
      var idCreated = response.data
      pseudo.pseudoId= idCreated

      setPseudo(pseudo)
      console.log("Id  created ",idCreated);

      console.log("NEW Pseudo ",pseudo)
      localStorage.setItem('pseudo', JSON.stringify(pseudo));
      setQRCodeUrl(false)
      setPseusoUnicityError(false)
      setPseudoDefined(true)
    }, (error) => {
      console.log("POST ",error);
      setPseusoUnicityError(true)
    });
   


  }

  const handlePseudoName = (_event,name) => {
    
    setPseudo({...pseudo,pseudoName:name})
    console.log("Pseudo change ",pseudo)
  }

  function definePseudo(){
    
    console.log("PSEUDO LOCAL ", JSON.parse(localStorage.getItem('pseudo')))
 if (JSON.parse(localStorage.getItem('pseudo')== null)){
  console.log(" PSEUDO LOCAL 2",pseudo)
      localStorage.setItem('pseudo', JSON.stringify(pseudo));

    }
   
    const displayPseudo =  !pseudoDefined ? {}: { display: "none" };
    const displayPseudoError = pseudoUnicityError ? {} : { display: "none" };
    console.log(" PSEUDO Displayed ",displayPseudo)
    console.log ( "PSEUDO Defined ",pseudoDefined)

    return (
      <Card ouiaId="BasicCard" style={displayPseudo}>
    <CardTitle>Red Hat Peer-to-Peer Shop</CardTitle>
    <CardBody>
  
      <Form>
            <FormGroup
              label="Saisissez un pseudo pour votre dressing"
                  
              isRequired
              fieldId="simple-form-name-01"
            >
              <TextInput
                isRequired
                type="text"
                id="simple-form-name-01"
                name="userPseudo"
                aria-describedby="simple-form-name-01-helper"
                onChange={handlePseudoName}
              />
               <HelperText style={displayPseudoError}>
      <HelperTextItem variant="error">Your pseudo is already taken !</HelperTextItem>
             </HelperText>

              </FormGroup>
            <ActionGroup>
              <Button variant="primary" onClick={handlePseudoCreation}>C'est parti !</Button>
            </ActionGroup>
            </Form>
            </CardBody>
            </Card>
    )
  }

  const handleSellItem = (e,index,attribute) => {

    
    const updatedObject = itemToSell[index]
    setItemToEdit({...itemToEdit,[attribute]:e})

    updatedObject[attribute]= e

    console.log("Updated Object",updatedObject)
  console.log("clik item", "value ", e," index ",index," attribute",attribute)


  };


  const handleEditItem = (index) => {
    return() =>{
    
    // draw image from url in canvas
   

    const dataset1 = {
      detections: [
      {
      box: [Object],
      class: 'redhat',
      label: 'Redhat',
      score: 0.9655831456184387
      },
      {
      box: [Object],
      class: 'tshirt, chemise',
      label: 'Tshirt, chemise',
      score: 0.6621403098106384
      }
      ],
      image_url: 'https://www.teez.in/cdn/shop/products/Red-Hat-T-Shirt-2_fa4655dc-8606-4d52-be50-787f19bd4310_large.jpg?v=1580794873'
      }

      setInventoryImage(dataset1["image_url"])
      console.log(" dataset raw ",dataset1["detections"])

      toClotheObject(dataset1["detections"])

/* 
      dataset1["detections"].map(function(o,i) {
 
        const clothObj =
        {
          id: "",
          name: "",
          class: "",
          description: "",
          price: "",
          image_url:""
        }

        clothObj.class= o.class
        clothObj.id = i 
        return(
          
          setItemToSell((prevItems)=> [...prevItems,clothObj]) 
          
  
      
      )}); */
        
  
        console.log(" dataset raw 0",dataset1)
    console.log(" dataset raw ",dataset1["detections"])
  

   
    //setProductPrediction(dataset1["detections"])
    //setItemToSell(dataset1["detections"])

    
  

    // clothes set to comment for testing object detection
    //setClothes([clothes[index]])
    setshopWindow(true)
    setCatalog(false)
 
 
  }
}

function renderInventoryImage(){

  const displayInventoryImage= inventoryImage ? {} : { display: "none" };

  return(
    <div className="inventoryImage"  style={displayInventoryImage}> 
      <img alt='' className="inventoryImageCanva" src={inventoryImage} style={{height:imageCanvas?.height, width:imageCanvas?.width}} />

    </div>

  )
}

const toClotheObject = (products,predicted_image_url) =>{

  console.log("To Clothe Object ",products)
  console.log("To Clothe Object IMG  ",predicted_image_url)
  products.map(function(o,i) {
 
    const clothObj = {
    "description": "",
        "itemId": '',
        "link": "",
        "location": "",
        "name": "",
        "price": 0.0,
        "quantity": 1,
        "image_url":"",
        "userId":""
    }

   /*  const clothObj =
    {
      id: "",
      name: "",
      class: "",
      description: "",
      price: '',
      image_url:""
    } */
    // set price to 0 when it is predicted

    if (o.price== null){
      clothObj.price=0.0
    }
    if (o.itemId== null){
      clothObj.itemId=0
    }
    if (o.image_url==null){
      clothObj.image_url= predicted_image_url
    }
    clothObj.class= o.class
    clothObj.id = i 
    clothObj.userId = pseudo.pseudoId
  
      return(
      setItemToSell((prevItems)=> [...prevItems,clothObj]) )
  })
}

const sendToInventory = (index) => {
  return() =>{

  console.log("INDEX INVENTORY ",index)

  //console.log(" RAW INVENTORY ", itemToSell)
  
  let payload = itemToSell[index]
  console.log("SEND TO INVENTORY ",payload)

  axios.post('http://localhost:8083/products', 
    payload
  ,{headers:
    {'Content-Type': 'application/json'}
      })
  .then((response) => {
    console.log("POST ",response);
  }, (error) => {
    console.log("POST ",error);
  });

  
}
}


  



 function renderShopWindow(){
  
        const shopWindowDisplay = shopWindow ? {} : { display: "none" };
        const options = [
          { value: "tshirt" , label : "tshirt" },
          { value: "chemise" , label : "chemise" },
          { value: "manteau" , label : "manteau" },
          { value: "pull" , label : "pull" },
          { value: "pantalon, bas" , label : "pantalon, bas" },
          { value: "chaussures" , label : "chaussures" },
          { value: "ensemble" , label : "ensemble" },
          { value: "lunettes" , label : "lunettes" },
          { value: "cravatte" , label : "cravatte" },
          { value: "montre" , label : "montre" },
          { value: "foulard" , label : "foulard" },
          { value: "redhat" , label : "redhat" },
          { value: "sac" , label : "sac" },
          { value: "parapluie" , label : "parapluie" },
          { value: "accessoire" , label : "accessoire" }
        ]
       
        const quantities = [
          { value: "0" , label : "0" },
          { value: "1" , label : "1" },
          { value: "2" , label : "2" },
          { value: "3" , label : "3" },
          { value: "4" , label : "4" },
          { value: "5" , label : "5" },
      

        ]
        const prices = [
          { value: "0" , label : "Free" },
          { value: "1" , label : "1" },
          { value: "2" , label : "2" },
          { value: "5" , label : "5" },
          { value: "10" , label : "10" },
          { value: "15" , label : "15" },
          { value: "20" , label : "20" }
        ]

        console.log("ITEM TO SELL ",itemToSell)
        
        
     
        return(
          <div className="sell-item"  style={shopWindowDisplay}> 
    <div class="pf-v5-l-gallery pf-m-gutter">

          {itemToSell.map((clothe,index) =>(
             

          <Card ouiaId="BasicCard">
          <CardBody>
  
        <Form>
        <FormGroup label="Item Category Predicted by AI">
        <FormSelect 
          id="category"
          aria-label="FormSelect Input"
          value={clothe.class}
          onChange={e => handleSellItem(e.target.value,index,"class")}
          isRequired fieldId="simple-form-name-03" >
          {options.map((option, index) => (
            <FormSelectOption
              key={index}
              value={option.value}
              label={option.label}
            />
          ))}
        </FormSelect>
        </FormGroup>
        <FormGroup
          label="Name" isRequired fieldId="simple-form-name-01" >
          <TextInput isRequired type="text" onChange={e => handleSellItem(e.target.value,index,"name")} value={clothe.name} id="simple-form-name-02" name="itemName" aria-describedby="simple-form-name-01-helper"/>
        </FormGroup>
        <FormGroup
          label="Description" isRequired fieldId="simple-form-name-02" >
          <TextInput isRequired type="text" onChange={e => handleSellItem(e.target.value,index,"description")} value={clothe.description} id="simple-form-name-03" name="descriptipn" aria-describedby="simple-form-name-01-helper"/>
        </FormGroup>
        <FormGroup label="Quantity to sell">
           <FormSelect 
           onChange={e => handleSellItem(e.target.value,index,"quantity")}
           id="price"
           aria-label="FormSelect Input"
           value={clothe.quantity}
           isRequired fieldId="simple-form-name-04" >
           {quantities.map((qty, index) => (
             <FormSelectOption
               key={index}
               value={qty.value}
               label={qty.label}
             />
           ))}
         </FormSelect>
         </FormGroup>
        <FormGroup label="Price (€)">
           <FormSelect 
           onChange={e => handleSellItem(e.target.value,index,"price")}
           id="price"
           aria-label="FormSelect Input"
           value={clothe.price}
           isRequired fieldId="simple-form-name-04" >
           {prices.map((price, index) => (
             <FormSelectOption
               key={index}
               value={price.value}
               label={price.label}
             />
           ))}
         </FormSelect>
         </FormGroup>
        <ActionGroup>
          <Button variant="primary" onClick={sendToInventory(index)} >Sell !</Button>
        </ActionGroup>
        </Form>
        </CardBody>
        </Card>
          ))
          }
    </div>
          </div>
        )
      }
  
  function renderCatalog(){
    const productsToSellLayout = catalog ? {} : { display: "none" };
    return (
    <div className="item-catalog" style={productsToSellLayout}>
        <div
      class="pf-v5-l-gallery pf-m-gutter"
    >
  
  {clothes.map((clothe,index) =>(
  
  <Card ouiaId="BasicCard">

    <CardTitle>{clothe.description}</CardTitle>
    <CardBody>{clothe.name}</CardBody> 
    <CardBody>Quantity remaining : <div class="pf-u-font-weight-bold">{clothe.quantity}</div></CardBody>  
    <CardBody>{clothe.price}</CardBody>
    <CardFooter>
    <Button onClick={handleEditItem(index)} variant="secondary" size="small">
      Edit
    </Button>
    </CardFooter>
    <Divider component="div" />

  </Card>


))}
</div>
</div>)

    
  }



  
/*
a ajouter au apres snapshot
 {renderInventoryImage()}

 */

         
         

  
  return (
    <div className="photo">
      <div>
    <Title class="pf-v5-u-text-align-center" headingLevel="h1"> The Good Corner </Title>
    <Title class="pf-v5-u-text-align-center" headingLevel="h2"> Welcome {pseudo.pseudoName} </Title>

    <br></br>
    </div>

    {definePseudo()}
    {renderCamera()}
    {renderSnapshot()}
   
    {renderQRCode()}
    {renderCatalog()}
    {renderShopWindow()}
      
    </div>
  );

 
  
  

  function GetObjectPrediction(){
  
   
    axios.get(`http://localhost:8083/products`)

   .then(response => {

    let items = response?.data;

     setClothes(items)
     setImage(true)
     setCatalog(false)
     setQRCodeUrl(false)
     setProductPrediction(true)



   /* return(
      <div>
      {clothes['entries'].map((obj, i) => {
        return (
          <div key={i}>
            <p>{obj?.API}</p>
          </div>
        );
      })}
    </div>
  );
    */
   
  })
  .catch(error=>{
    console.error("error api",error)
  })

}


  function getCatalog(){

    // route to update to get items by userId
   // http://localhost:8083/products/pseudo.pseudoId
    axios.get(`http://localhost:8083/products`)
   .then(response => {

    let items = response?.data;

     setClothes(items)
     setCatalog(true)
     

    //console.log("photo prediction ",prediction.detections)
    console.log("photo sent to inventory")
   /* return(
      <div>
      {clothes['entries'].map((obj, i) => {
        return (
          <div key={i}>
            <p>{obj?.API}</p>
          </div>
        );
      })}
    </div>
  );
    */
   
  })
  .catch(error=>{
    console.error("error api",error)
  })

}
}



function mapStateToProps(state) {
  return { ...state.appReducer, ...state.photoReducer };
}

function mapDispatchToProps(dispatch) {
  return {
    reset: () => {
      dispatch(resetSearch());
    },
    searchPhoto: (photo) => {
      dispatch(searchPhoto(photo));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Photo);
