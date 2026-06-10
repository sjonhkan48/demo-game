import {createRouter,createWebHistory} from "vue-router"

import GameView from "../views/GameView.vue"
import AdminView from "../views/AdminView.vue"


const router=createRouter({

history:createWebHistory(),


routes:[


{
path:"/",
component:GameView
},


{
path:"/admin",
component:AdminView
}


]


})


export default router
