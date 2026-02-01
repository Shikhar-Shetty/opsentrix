#!/bin/bash

# Function to deploy the application
deploy() {
    kubectl apply -f opsentrix-namespace.yaml 
    kubectl label namespace opsentrix istio-injection=enabled
    kubectl apply -f .
}

# Function to undeploy the application
undeploy() {
    kubectl delete -f .
}

# Main script
while true; do
    read -p "Yes/y for deploy, No/n for undeploy, Port/p for port-forward to istio-ingressgateway: " choice
    case $choice in
        yes|y|Yes|Y)
            deploy
            ;;
        no|n|No|N)
            undeploy
            break
            ;;
        p|P|Port|port)
            kubectl port-forward svc/istio-ingressgateway -n istio-system 8080:80
            ;;
        *)
            echo "Invalid choice. Please try again."
            ;;
    esac
done