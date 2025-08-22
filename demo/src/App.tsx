import { useEffect } from 'react'
import gsap from 'gsap'
import './App.css'
import HomePage from './pages/Home/HomePage'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { NavigationMenuDemo } from "./components/NavBar"
import Login from './pages/Home/Login'
import { Toaster } from "sonner"
import Register from './pages/Home/Register'
import CreateMovie from './pages/Movies/CreateMovie'
import Movies from './pages/Movies/Movies'
import EditMovie from './pages/Movies/EditMovie'
import MovieStream from './pages/Movies/Movie'
import CreateMeet from './pages/Meets/CreateMeet'
import Meets from './pages/Meets/Meets'
import Meet from './pages/Meets/Meet'
import { AuthProvider } from './providers/AuthProvider'
// import React, { Component, ReactNode } from 'react';

// class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
//   state = { hasError: false };

//   static getDerivedStateFromError() {
//     return { hasError: true };
//   }

//   componentDidCatch(error: Error, info: any) {
//     console.error("ErrorBoundary caught an error:", error, info);
//   }

//   render() {
//     if (this.state.hasError) {
//       return <h2>Something went wrong in Movies component.</h2>;
//     }
//     return this.props.children;
//   }
// }


function App() {
  // useEffect(() => {
  //   // Create GSAP context for proper cleanup
  //   let ctx = gsap.context(() => {
  //     // --- Your GSAP animation logic here ---
  //     gsap.from("h1", {
  //       scale: 0,
  //       ease: "back.out(2)",
  //       delay: 1,
  //     });

  //     function playAnimation(shape: Element) {
  //       let tl = gsap.timeline();
  //       tl.from(shape, {
  //         opacity: 0,
  //         scale: 0,
  //         ease: "elastic.out(1,0.3)",
  //       })
  //         .to(
  //           shape,
  //           {
  //             rotation: gsap.utils.random(-360, 360),
  //           },
  //           "<"
  //         )
  //         .to(
  //           shape,
  //           {
  //             y: "120vh",
  //             ease: "back.in(.4)",
  //             duration: 1,
  //           },
  //           0
  //         );
  //     }

  //     let flair = gsap.utils.toArray<HTMLElement>(".flair");
  //     let gap = 100;
  //     let index = 0;
  //     let wrapper = gsap.utils.wrap(0, flair.length);
  //     gsap.defaults({ duration: 1 });

  //     let mousePos = { x: 0, y: 0 };
  //     let lastMousePos = { ...mousePos };
  //     let cachedMousePos = { ...mousePos };

  //     const handleMouseMove = (e: MouseEvent) => {
  //       mousePos = { x: e.x, y: e.y };
  //     };

  //     window.addEventListener("mousemove", handleMouseMove);

  //     const ticker = gsap.ticker.add(() => {
  //       let travelDistance = Math.hypot(
  //         lastMousePos.x - mousePos.x,
  //         lastMousePos.y - mousePos.y
  //       );

  //       cachedMousePos.x = gsap.utils.interpolate(
  //         cachedMousePos.x || mousePos.x,
  //         mousePos.x,
  //         0.1
  //       );
  //       cachedMousePos.y = gsap.utils.interpolate(
  //         cachedMousePos.y || mousePos.y,
  //         mousePos.y,
  //         0.1
  //       );

  //       if (travelDistance > gap) {
  //         let wrappedIndex = wrapper(index);
  //         let img = flair[wrappedIndex];
  //         if (!img) return;

  //         gsap.killTweensOf(img);
  //         gsap.set(img, { clearProps: "all" });
  //         gsap.set(img, {
  //           opacity: 1,
  //           left: mousePos.x,
  //           top: mousePos.y,
  //           xPercent: -50,
  //           yPercent: -50,
  //         });

  //         playAnimation(img);
  //         index++;
  //         lastMousePos = { ...mousePos };
  //       }
  //     });

  //     // Cleanup function
  //     return () => {
  //       window.removeEventListener("mousemove", handleMouseMove);
  //       gsap.ticker.remove(ticker);
  //     };
  //   });

  //   // Cleanup context on unmount
  //   return () => ctx.revert();
  // }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        {/* ✅ Navbar will be visible everywhere */}
        <NavigationMenuDemo />
        <div className='my-auto mb-20'>
        <div className="content fixed inset-0 pointer-events-none z-50">
          <img className="flair absolute opacity-0" src="https://assets.codepen.io/16327/Revised+Flair.png" alt="" />
          <img className="flair absolute opacity-0" src="https://assets.codepen.io/16327/Revised+Flair-1.png" alt="" />
          <img className="flair absolute opacity-0" src="https://assets.codepen.io/16327/Revised+Flair-2.png" alt="" />
          <img className="flair absolute opacity-0" src="https://assets.codepen.io/16327/Revised+Flair-3.png" alt="" />
          <img className="flair absolute opacity-0" src="https://assets.codepen.io/16327/Revised+Flair-4.png" alt="" />
          <img className="flair absolute opacity-0" src="https://assets.codepen.io/16327/Revised+Flair-5.png" alt="" />
          <img className="flair absolute opacity-0" src="https://assets.codepen.io/16327/Revised+Flair-6.png" alt="" />
          <img className="flair absolute opacity-0" src="https://assets.codepen.io/16327/Revised+Flair-7.png" alt="" />
          <img className="flair absolute opacity-0" src="https://assets.codepen.io/16327/Revised+Flair-8.png" alt="" />
        </div>
        </div>
      
        {/* ✅ Define your routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/create" element={<CreateMovie />} />
          <Route path="/movies/:id/edit" element={<EditMovie />} />
          <Route path="/movies/:id" element={<MovieStream />} />
          {/* Add more routes as needed */}
          <Route path="/meets/create" element={<CreateMeet />} />
          <Route path="/meets" element={<Meets />} />
          <Route path="/meet/:id" element={<Meet />} />
          {/* add more routes as needed */}
        </Routes>
        
        {/* Toast notifications */}
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App;