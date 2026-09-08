'''
Nabil Allimi
Professor Weiss
CMSCI 453- Programming Project 1
2/1/2026

Three Sorting Algorithms:
For this program, three sorting algorithms were picked, with their big-O shown below:
Insertion Sort 	O(n2)
Merge Sort 		O(n  Log n)
Heap Sort 		O(n  Log n)


This file contains all three sorting algorithms in one file.
'''
import random
import csv # to write into a csv file. 
# Adding comprison code 
insert_compar = 0
heap_compar = 0
merge_compar = 0
# Insertion Sort Algorithm
# Source: https://www.geeksforgeeks.org/python/python-program-for-insertion-sort/

def insertionSort(arr):
    global insert_compar  # necessary for makeing the varaible global
    n = len(arr)
    
    if n <= 1:
        return
    for i in range(1, n): 
    # Outer loop runs n-1 times: i = 1..n-1  Θ(n) iterations
        key = arr[i]         
        j = i - 1
        while j >= 0: 
            insert_compar+=1 # count the comparison
            # If true, we shift arr[j] right; else we found position for key.
            if key < arr[j]:
                arr[j + 1] = arr[j]
                j -= 1
            else:
                break
        arr[j + 1] = key        # Insert 'key' at its correct position (j + 1

# Merge Sort Algorithm
# Source: https://www.geeksforgeeks.org/dsa/python-program-for-heap-sort/
def heapify(arr, n, i):
    global heap_compar
    largest = i    
    l = 2 * i + 1    
    r = 2 * i + 2  

    if l < n:
        heap_compar+=1 # counts the comparisons.
        if  arr[l] > arr[largest]:
            largest = l

    if r < n:
        heap_compar+=1 # counts the comparisons. 
        if  arr[r] > arr[largest]: 
            largest = r 

    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        heapify(arr, n, largest)



def heapSort(arr):
    n = len(arr)

    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)

    for i in range(n - 1, 0, -1):
        arr[i], arr[0] = arr[0], arr[i]  # Swap max to end
        heapify(arr, i, 0)

# Merge Sort
# source: https://www.geeksforgeeks.org/dsa/python-program-for-heap-sort/
def merge(arr, l, m, r):
    global merge_compar # this code is necessary to make the counter gloabl
    n1 = m - l + 1
    n2 = r - m

    L = [0] * n1
    R = [0] * n2

    for i in range(n1):
        L[i] = arr[l + i]
    for j in range(n2):
        R[j] = arr[m + 1 + j]

    i = j = 0
    k = l

    while i < n1 and j < n2:
        merge_compar +=1 # add the count. 
        if L[i] <= R[j]:
            arr[k] = L[i]
            i += 1
        else:
            arr[k] = R[j]
            j += 1
        k += 1

    while i < n1:
        arr[k] = L[i]
        i += 1
        k += 1
    while j < n2:
        arr[k] = R[j]
        j += 1
        k += 1

def mergeSort(arr, l, r):
    if l < r:
        m = l + (r - l) // 2
        mergeSort(arr, l, m)
        mergeSort(arr, m + 1, r)
        merge(arr, l, m, r)



# Testing the algorithm before making the actual test cases for 1-2n
'''
test_cases = [
        [],
        [1],
        [2, 1],
        [5, 2, 4, 6, 1, 3],
        [3, 3, 3, 3],
        [9, 1, 8, 2, 7, 3, 6, 4, 5],
        [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    ]

for  a in test_cases:
    insert_compar = 0 # I got unbound error hope this fix it
    a1 = a.copy()
    insertionSort(a1)
    print("Insertion Sort:", a1, "comparisons:", insert_compar)
    heap_compar = 0
    a2 = a.copy()
    heapSort(a2)
    print("Heap Sort:", a2, "comparisons:", heap_compar)
    heap_compar = 0 # reset to zero each time 
    a3 = a.copy() # get a copy so the it is not affected by the above. 
    mergeSort(a3, 0, len(a3) -1 )
    print("Merge Sort:", a3, "Comprarison " , merge_compar)


'''

# generate 20 random list with 1-2n. with values in range [1,2n]
random.seed(1)
def generate_list(n):  # range n 
    arr =[]
    for i in range(n):
        arr.append(random.randint(1,2*n))
    return arr

# generate twinty different list
def generate_20(n): # n (1, 2n)
    test_cases = [generate_list(n) for _ in range(20)] #  genearate a list 20 test cases whcih will be pretty big. 
    return test_cases

# testing 

'''
print(generate_20(20)) # this works so far. 
'''



### Runing the comparisons
# sample list
n_sample = [(2**i)*100000 for i in range(0,9) ]
# print(n_sample)
print([(2**i)*100000 for i in range(0,9)]) # test
"""
Write into csv after runing the sorting algorithm
"""

def is_sorted(list1): # to check if the list is sorted. if not sorted return false so that we know something went wrong. 

    for i in range(1, len(list1)):
        if list1[i-1]>list1[i]:
            return False
        
    return True

# write into a csv file 
# source : https://docs.python.org/3/library/csv.html
with open('Comparisons.csv','a', newline='') as csvfile: # w for write and a for append mode. 
    writer = csv.writer(csvfile)
    writer.writerow(["n", "trial", "Inserstion Comparison", "merge_comparison", "heap_comparison"])
    for n in n_sample:
        print("Running into the file for n=", n)
        generated_list = generate_20(n)
        ## RUnning all the alrogithms 
        for index, base in enumerate(generated_list, start=1):
        # - ===  Insertion  running the same test as tested above. 
            insert_compar = 0 
            a1 = base.copy() # getting a copy of it so the original doesn't change. 
            insertionSort(a1)

            # Merge --- Running the same test as tested above. 
            merge_compar = 0
            a2 = base.copy()
            if len(a2) > 0:
                mergeSort(a2, 0, len(a2) - 1)

            # --- Heap  Running the same test as tested above. 
            heap_compar = 0
            a3 = base.copy()
            heapSort(a3)

            # Optional correctness check (good while developing)
            # if not (is_sorted(a2) and is_sorted(a3)): # i never run into this error save to comment out just in case. 
            #     raise ValueError(f"Sorting mismatch at n={n}, trial={index}")

            writer.writerow([n, index, insert_compar, merge_compar, heap_compar]) # write everyting in the file
        csvfile.flush() # good for clearing the memory. 

   




