function quickSort(items, leftIndex, rightIndex) {
  // Declare an index that will be our pivot reference.
  var pivotIndex;

  // If the array has only one item, it's already sorted!
  // If it has no items, we don't want to try to sort it!
  if (items.length > 1) {
    // As long as the array has two items, we can parition it.
    pivotIndex = partition(items, leftIndex, rightIndex);

    console.log(items);
    console.log('** 1 pivot is: ', items[pivotIndex]);
    console.log('Pivot index is: ',pivotIndex, '.Left index is: ',leftIndex, '.Right index is: ', rightIndex);

    // If the left reference hasn't been incremented to
    // reach the pivot yet, we want to keep comparing it.
    if (leftIndex < pivotIndex - 1) {
      quickSort(items, leftIndex, pivotIndex - 1);
    }

    // If the right reference hasn't reached the 
    // pivotIndex yet, we need to keep comparing it.
    if (pivotIndex < rightIndex) {
      console.log('Right:',pivotIndex,rightIndex);
      quickSort(items, pivotIndex, rightIndex);
    }

  }

  return items;
}

// The partition() method takes a list of items, and a left
// reference, as well as a right reference. Both left and right
// are indexes to indicate where the pointers should start.
function partition(items, left, right) {
  // Find the pivot by adding the two indexes together
  // and dividing by two (the middle element, effectively).
  var pivot = items[Math.floor((right + left) / 2)];
  var l = left;
  var r = right;

  console.log(items);
  console.log('** 2 pivot is: ', pivot, '. Left is ', left, ', right is ', right);
  console.log('** left is: ', items[left]);
  console.log('** right is: ', items[right]);

  // Once the left reference is greater than the right reference,
  // we have finished sorting this set of items, and we can return.
  while (l <= r) {
    // If the left pointer is less than the pivot, increment it.
    // In other words, move the pointer to the right.
    while (items[l] < pivot) {
      l++;
      console.log('l is now pointing to: ', items[l]);
    }

    // If the right pointer is greater than the pivot, decrement it.
    // In other words, move the pointer to the left.
    while (items[r] > pivot) {
      r--;
      console.log('r is now pointing to: ', items[r]);
    }

    // If the left pointer is larger than the pivot, and the right
    // pointer is not bigger than the pivot, swap the two elements.
    if (l <= r) {
      console.log('** now swapping l and r pointers: ', items[l], items[r]);

      swap(items, l, r);

      // After swapping, increment/decrement the pointers respectively.
      l++;
      r--;

      // console.log('l is now pointing to: ', items[l]);
      // console.log('r is now pointing to: ', items[r]);
    }
  }

  // The left item becomes the new pivot element.
  return l;
}

function swap(items, leftPointerIndex, rightPointerIndex){
  // Create a temporary reference for the left item.
  var tempReference = items[leftPointerIndex];

  // Move left item to the index that contains right item.
  // Move right item to the temporary reference.
  items[leftPointerIndex] = items[rightPointerIndex];
  items[rightPointerIndex] = tempReference;
}


var items = [19, 22, 63, 105, 2, 46];
quickSort(items, 0, items.length - 1);