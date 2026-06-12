import { createRouter, createWebHistory } from "vue-router"

import GameView from "../views/GameView.vue"
import AdminView from "../views/AdminView.vue"


const router = createRouter({

  history: createWebHistory(),

  routes: [

    {
      path: "/",
      name: "home",
      component: GameView
    },


    {
      path: "/admin",
      name: "admin",
      component: AdminView
    },


    {
      path: "/player/:id",
      name: "player",
      component: GameView
    }


  ]

})


export default router
