#! /bin/bash

cd frontend
npm run dev &
cd ../backend
npm run dev &
cd ../agent
./auto-run.sh &
wait
