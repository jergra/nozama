/* eslint-disable @next/next/no-img-element */
import NextLink from 'next/link';
import { 
  Grid, 
  Link, 
  Typography,
} from '@material-ui/core';
import Layout from '../components/Layout';
import db from '../utils/db';
import Product from '../models/Product';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useContext, useState } from 'react';
import { Store } from '../utils/Store';
import ProductItem from '../components/ProductItem';
import Carousel from 'react-material-ui-carousel';
import useStyles from '../utils/styles';


import { Pagination } from '@material-ui/lab';



export default function Home(props) {

  const [start, setStart] = useState(0)
  const pageHandler = (e, page) => {
    console.log('e, page:', e, page);
    if (page === 1) {
      setStart(0)
    }
    if (page === 2) {
      setStart(6)
    }
    if (page === 3) {
      setStart(12)
    }
  };
  
  const classes = useStyles();
  const router = useRouter();
  const { state, dispatch } = useContext(Store);
  const { topRatedProducts, featuredProducts } = props;
  const addToCartHandler = async (product) => {
    const existItem = state.cart.cartItems.find((x) => x._id === product._id);
    const quantity = existItem ? existItem.quantity + 1 : 1;
    const { data } = await axios.get(`/api/products/${product._id}`);
    if (data.countInStock < quantity) {
      window.alert('Sorry. Product is out of stock');
      return;
    }
    dispatch({ type: 'CART_ADD_ITEM', payload: { ...product, quantity } });
    router.push('/cart');
  };

  function getStyling(image) {
    if (image === '/images/banner1.jpg' || image === '/images/banner2.jpg') {
      return classes.featuredImage
    } else {
      return classes.featuredImageCustom
    }
  }

  return (
    <Layout>
      <Carousel className={classes.mt1} animation="slide" interval="50000">
        {featuredProducts.map((product) => (
          <NextLink
            key={product._id}
            href={`/product/${product.slug}`}
            passHref
          >
            <div className={classes.crop}>
              <Link>
                <img
                  src={product.featuredImage}
                  alt={product.name}
                  className={getStyling(product.featuredImage)}
                ></img>
              </Link>
            </div>
          </NextLink>
        ))}
      </Carousel>
      <Typography variant="h2">Popular Products</Typography>
      <Grid container spacing={3}>
        {topRatedProducts.slice(start, start + 6).map((product) => (
          <Grid item md={4} key={product.name}>
            <ProductItem
              product={product}
              addToCartHandler={addToCartHandler}
            />
          </Grid>
        ))}
      </Grid>

      <Pagination
        className={classes.mt1}
        //defaultPage={1}
        count={ Math.floor(topRatedProducts.length / 6 + 1)}
        onChange={pageHandler}
      ></Pagination>

    </Layout>
  );
}

export async function getServerSideProps() {
  await db.connect();
  const featuredProductsDocs = await Product.find(
    //{ isFeatured: true },
    //'-reviews'
  )
    .lean()
    //.limit(10);
  const topRatedProductsDocs = await Product.find({}, '-reviews')
    .lean()
    .sort({
      rating: -1,
    })
    //.limit(15);
    
  await db.disconnect();

  return {
    props: {
      featuredProducts: featuredProductsDocs.map(db.convertDocToObj),
      topRatedProducts: topRatedProductsDocs.map(db.convertDocToObj),
    },
  };
}
